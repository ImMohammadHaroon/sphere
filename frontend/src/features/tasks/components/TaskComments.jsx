import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Paperclip, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { AttachmentListItem } from "@/components/attachments/AttachmentListItem";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useAuth } from "@/hooks/useAuth";
import { useFilePreview } from "@/hooks/useFilePreview";
import {
  attachmentMeta,
  formatFileSize,
  getFileIcon,
  MAX_ATTACHMENT_SIZE,
} from "@/lib/fileUtils";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/features/tasks/hooks/useComments";
import { useTaskCollaborationSocket } from "@/features/tasks/hooks/useTaskCollaborationSocket";
import { uploadCommentAttachment } from "@/lib/commentAttachmentsApi";

const MAX_COMMENT_LENGTH = 5000;

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function PendingCommentFiles({
  files,
  onAdd,
  onRemove,
  onPreview,
  disabled = false,
}) {
  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState("");

  function handleFileChange(event) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFileError("");

    if (selected.length === 0) {
      return;
    }

    const valid = [];
    const rejected = [];

    for (const file of selected) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        rejected.push(file.name);
        continue;
      }
      valid.push(file);
    }

    if (rejected.length > 0) {
      setFileError(
        `These files exceed 5MB and were skipped: ${rejected.join(", ")}`
      );
    }

    if (valid.length > 0) {
      onAdd(valid);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Attachments
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="mr-2 h-3.5 w-3.5" />
          Add files
        </Button>
      </div>

      {fileError ? <Alert variant="error">{fileError}</Alert> : null}

      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-text-muted">
          Optional files (max 5MB each).
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);

            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="container-item flex items-center gap-3 rounded-lg border border-border bg-surface-raised/50 px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    className="truncate text-left text-sm font-medium text-primary hover:underline"
                  >
                    {file.name}
                  </button>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
                  aria-label="Remove file"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CommentAttachmentList({
  attachments = [],
  loadingId,
  onOpen,
}) {
  if (!attachments.length) {
    return null;
  }

  return (
    <ul className="mt-3 space-y-2">
      {attachments.map((attachment) => {
        const meta = attachmentMeta(attachment);
        const isItemLoading = loadingId === attachment._id;

        return (
          <AttachmentListItem
            key={attachment._id}
            attachment={attachment}
            meta={meta}
            isLoading={isItemLoading}
            onOpen={() => onOpen(attachment)}
            className="bg-surface"
          />
        );
      })}
    </ul>
  );
}

export function TaskComments({ taskId, projectId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role ?? "";
  const isClient = role === "client";
  const isElevated = role === "org_admin" || role === "project_manager";
  const filePreview = useFilePreview();

  useTaskCollaborationSocket(projectId, taskId);

  const { data: comments = [], isLoading, isError, error } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [body, setBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState("idle");
  const [loadingId, setLoadingId] = useState(null);

  function canDeleteComment(comment) {
    if (isElevated) return true;
    return comment.authorId === user?.id || comment.author?.id === user?.id;
  }

  function addPendingFiles(files) {
    setPendingFiles((current) => [...current, ...files]);
  }

  function removePendingFile(index) {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  }

  async function uploadPendingFiles(commentId) {
    const results = await Promise.allSettled(
      pendingFiles.map((file) =>
        uploadCommentAttachment(taskId, commentId, file)
      )
    );

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      throw new Error(
        `Comment posted, but ${failed.length} file(s) failed to upload.`
      );
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const trimmed = body.trim();
    if (!trimmed && pendingFiles.length === 0) {
      setFormError("Add a comment or attach at least one file.");
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setFormError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitPhase("posting");
      const result = await createComment.mutateAsync(trimmed);
      const commentId = result.comment?._id;

      if (pendingFiles.length > 0 && commentId) {
        setSubmitPhase("uploading");
        await uploadPendingFiles(commentId);
        queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      }

      setBody("");
      setPendingFiles([]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to post comment.");
    } finally {
      setIsSubmitting(false);
      setSubmitPhase("idle");
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment.mutateAsync(commentId);
    } catch {
      // mutation error surfaces via deleteComment state if needed
    }
  }

  async function handleOpenAttachment(commentId, attachment) {
    if (loadingId) {
      return;
    }

    setLoadingId(attachment._id);

    try {
      await filePreview.openPreview(attachment, {
        type: "comment",
        taskId,
        commentId,
        attachmentId: attachment._id,
      });
    } catch {
      setFormError("Failed to open file.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handlePreviewPendingFile(file) {
    await filePreview.openPreview(file, { type: "local", file });
  }

  const busy = createComment.isPending || isSubmitting;
  const submitLabel =
    submitPhase === "uploading"
      ? `Uploading ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}…`
      : submitPhase === "posting"
        ? "Posting comment…"
        : "Post comment";

  return (
    <>
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-text-primary">Comments</h3>
          <p className="text-sm text-text-secondary">
            Discuss progress and share updates on this task.
          </p>
        </div>

        {isLoading ? <CommentsSkeleton /> : null}

        {isError ? (
          <Alert variant="error">
            {error instanceof Error ? error.message : "Failed to load comments."}
          </Alert>
        ) : null}

        {!isLoading && !isError ? (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
                No comments yet.
                {!isClient ? " Be the first to add one." : ""}
              </p>
            ) : (
              <ul className="space-y-4">
                {comments.map((comment) => (
                  <li
                    key={comment._id}
                    className="container-item flex gap-3 rounded-lg border border-border bg-surface-raised/50 p-4"
                  >
                    <UserAvatar user={comment.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-text-primary">
                          {comment.author?.name ?? "Unknown"}
                        </span>
                        <span className="text-xs text-text-muted">
                          {comment.createdAt
                            ? formatDistanceToNow(new Date(comment.createdAt), {
                                addSuffix: true,
                              })
                            : ""}
                        </span>
                      </div>
                      {comment.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                          {comment.body}
                        </p>
                      ) : null}
                      <CommentAttachmentList
                        attachments={comment.attachments}
                        loadingId={loadingId}
                        onOpen={(attachment) =>
                          handleOpenAttachment(comment._id, attachment)
                        }
                      />
                    </div>
                    {canDeleteComment(comment) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
                        aria-label="Delete comment"
                        onClick={() => handleDelete(comment._id)}
                        isLoading={deleteComment.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {!isClient ? (
              <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
                <Label htmlFor={`comment-${taskId}`}>Add a comment</Label>
                <textarea
                  id={`comment-${taskId}`}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={3}
                  maxLength={MAX_COMMENT_LENGTH}
                  placeholder="Write a comment…"
                  disabled={busy}
                  className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <PendingCommentFiles
                  files={pendingFiles}
                  onAdd={addPendingFiles}
                  onRemove={removePendingFile}
                  onPreview={handlePreviewPendingFile}
                  disabled={busy}
                />
                {formError ? <Alert variant="error">{formError}</Alert> : null}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={busy || (!body.trim() && pendingFiles.length === 0)}
                  >
                    {busy ? submitLabel : "Post comment"}
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}
      </Card>

      <FilePreviewDialog {...filePreview.dialogProps} />
    </>
  );
}

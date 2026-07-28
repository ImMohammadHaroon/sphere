import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, MessageSquare, Paperclip, Reply, Trash2, X } from "lucide-react";
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
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
import { useTaskCollaborationSocket } from "@/features/tasks/hooks/useTaskCollaborationSocket";
import { CommentBody } from "@/features/tasks/components/CommentBody";
import { MentionTextarea } from "@/features/tasks/components/MentionTextarea";
import { uploadCommentAttachment } from "@/lib/commentAttachmentsApi";
import { cn } from "@/lib/utils";

const MAX_COMMENT_LENGTH = 5000;

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

function buildCommentTree(comments) {
  const nodes = new Map(
    comments.map((comment) => [comment._id, { ...comment, replies: [] }])
  );
  const roots = [];

  for (const comment of comments) {
    const node = nodes.get(comment._id);
    if (comment.parentId && nodes.has(comment.parentId)) {
      nodes.get(comment.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function countComments(tree) {
  return tree.reduce(
    (total, comment) => total + 1 + countComments(comment.replies ?? []),
    0
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
        <Label className="text-xs font-medium text-text-muted">Attachments</Label>
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
          variant="accent"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="mr-2 h-3.5 w-3.5" />
          Add files
        </Button>
      </div>

      {fileError ? <Alert variant="error">{fileError}</Alert> : null}

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);

            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    className="truncate text-left text-sm font-medium text-dashboard-accent hover:underline"
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
      ) : null}
    </div>
  );
}

function CommentAttachmentList({ attachments = [], loadingId, onOpen }) {
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

function CommentComposer({
  taskId,
  placeholder,
  submitLabel,
  replyingTo,
  onCancelReply,
  onSubmit,
  busy,
  submitPhase,
  pendingFiles,
  onAddFiles,
  onRemoveFile,
  onPreviewFile,
  formError,
  autoFocus = false,
  compact = false,
  members = [],
  currentUserId,
}) {
  const [body, setBody] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    const success = await onSubmit({
      body: trimmed,
      parentId: replyingTo?.id ?? null,
      pendingFiles,
      reset: () => setBody(""),
    });
    if (success) {
      setBody("");
    }
  }

  const label =
    submitPhase === "uploading"
      ? "Uploading files…"
      : submitPhase === "posting"
        ? "Posting…"
        : submitLabel;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-xl border bg-surface p-4 transition-colors",
        replyingTo
          ? "border-dashboard-accent/30 bg-dashboard-accent-subtle/20"
          : "border-border"
      )}
    >
      {replyingTo ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-dashboard-accent-subtle px-3 py-2 text-sm text-text-secondary">
          <div className="flex min-w-0 items-center gap-2">
            <CornerDownRight className="h-4 w-4 shrink-0 text-dashboard-accent" />
            <span className="truncate">
              Replying to{" "}
              <span className="font-medium text-text-primary">
                {replyingTo.authorName}
              </span>
            </span>
          </div>
          {onCancelReply ? (
            <button
              type="button"
              onClick={onCancelReply}
              className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
              aria-label="Cancel reply"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      <MentionTextarea
        id={`comment-${taskId}-${replyingTo?.id ?? "main"}`}
        value={body}
        onChange={setBody}
        members={members}
        currentUserId={currentUserId}
        rows={compact ? 2 : 3}
        maxLength={MAX_COMMENT_LENGTH}
        placeholder={placeholder}
        disabled={busy}
        autoFocus={autoFocus}
        className="flex w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-dashboard-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent/20"
      />

      <div className="mt-3">
        <PendingCommentFiles
          files={pendingFiles}
          onAdd={onAddFiles}
          onRemove={onRemoveFile}
          onPreview={onPreviewFile}
          disabled={busy}
        />
      </div>

      {formError ? <Alert variant="error" className="mt-3">{formError}</Alert> : null}

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {replyingTo && onCancelReply ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancelReply}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={busy || (!body.trim() && pendingFiles.length === 0)}
        >
          {busy ? label : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  depth = 0,
  isClient,
  canDeleteComment,
  onDelete,
  onReply,
  replyingToId,
  loadingId,
  onOpenAttachment,
  deletePending,
  taskId,
  onSubmitReply,
  replyBusy,
  replySubmitPhase,
  replyPendingFiles,
  onAddReplyFiles,
  onRemoveReplyFile,
  onPreviewReplyFile,
  replyFormError,
  onCancelReply,
  members = [],
  currentUserId,
}) {
  const isReplying = replyingToId === comment._id;

  return (
    <li className="space-y-3">
      <article
        className={cn(
          "relative rounded-xl border p-4",
          depth === 0
            ? "border-dashboard-accent/20 bg-surface shadow-sm"
            : "border-border/80 bg-surface-raised/50"
        )}
      >
        <div className="flex gap-3">
          <UserAvatar
            user={comment.author}
            size={depth > 0 ? "sm" : "md"}
            className={cn(
              depth === 0 && "ring-2 ring-dashboard-accent/15 ring-offset-2 ring-offset-surface"
            )}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-text-primary">
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
              <CommentBody
                body={comment.body}
                className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary"
              />
            ) : null}

            <CommentAttachmentList
              attachments={comment.attachments}
              loadingId={loadingId}
              onOpen={(attachment) => onOpenAttachment(comment._id, attachment)}
            />

            {!isClient ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReply(comment)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-dashboard-accent-subtle px-3 py-1.5 text-xs font-medium text-dashboard-accent transition-colors hover:bg-dashboard-accent/15"
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </button>

                {canDeleteComment(comment) ? (
                  <button
                    type="button"
                    onClick={() => onDelete(comment._id)}
                    disabled={deletePending}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {isReplying ? (
        <div className="mt-3">
          <CommentComposer
            taskId={taskId}
            placeholder={`Reply to ${comment.author?.name ?? "this comment"}…`}
            submitLabel="Post reply"
            replyingTo={{
              id: comment._id,
              authorName: comment.author?.name ?? "Unknown",
            }}
            onCancelReply={onCancelReply}
            onSubmit={onSubmitReply}
            busy={replyBusy}
            submitPhase={replySubmitPhase}
            pendingFiles={replyPendingFiles}
            onAddFiles={onAddReplyFiles}
            onRemoveFile={onRemoveReplyFile}
            onPreviewFile={onPreviewReplyFile}
            formError={replyFormError}
            autoFocus
            compact
            members={members}
            currentUserId={currentUserId}
          />
        </div>
      ) : null}

      {comment.replies?.length > 0 ? (
        <ul className="space-y-3 border-l-2 border-dashboard-accent/15 pl-4 sm:pl-5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              isClient={isClient}
              canDeleteComment={canDeleteComment}
              onDelete={onDelete}
              onReply={onReply}
              replyingToId={replyingToId}
              loadingId={loadingId}
              onOpenAttachment={onOpenAttachment}
              deletePending={deletePending}
              taskId={taskId}
              onSubmitReply={onSubmitReply}
              replyBusy={replyBusy}
              replySubmitPhase={replySubmitPhase}
              replyPendingFiles={replyPendingFiles}
              onAddReplyFiles={onAddReplyFiles}
              onRemoveReplyFile={onRemoveReplyFile}
              onPreviewReplyFile={onPreviewReplyFile}
              replyFormError={replyFormError}
              onCancelReply={onCancelReply}
              members={members}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function TaskComments({ taskId, projectId, embedded = false }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const role = user?.role ?? "";
  const isClient = role === "client";
  const isElevated = role === "org_admin" || role === "project_manager";
  const filePreview = useFilePreview();

  useTaskCollaborationSocket(projectId, taskId);

  const { data: comments = [], isLoading, isError, error } = useComments(taskId);
  const { data: members = [] } = useProjectMembers(projectId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [mainPendingFiles, setMainPendingFiles] = useState([]);
  const [replyPendingFiles, setReplyPendingFiles] = useState([]);
  const [formError, setFormError] = useState("");
  const [replyFormError, setReplyFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState("idle");
  const [replyingTo, setReplyingTo] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);
  const totalComments = useMemo(() => countComments(commentTree), [commentTree]);

  function canDeleteComment(comment) {
    if (isElevated) return true;
    return comment.authorId === user?.id || comment.author?.id === user?.id;
  }

  async function uploadPendingFiles(commentId, files) {
    const results = await Promise.allSettled(
      files.map((file) => uploadCommentAttachment(taskId, commentId, file))
    );

    const failed = results.filter((result) => result.status === "rejected");
    if (failed.length > 0) {
      throw new Error(
        `Comment posted, but ${failed.length} file(s) failed to upload.`
      );
    }
  }

  async function submitComment({ body, parentId, pendingFiles, reset }) {
    const trimmed = body.trim();
    if (!trimmed && pendingFiles.length === 0) {
      const message = "Add a comment or attach at least one file.";
      if (parentId) {
        setReplyFormError(message);
      } else {
        setFormError(message);
      }
      return false;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      const message = `Comment must be at most ${MAX_COMMENT_LENGTH} characters.`;
      if (parentId) {
        setReplyFormError(message);
      } else {
        setFormError(message);
      }
      return false;
    }

    try {
      setIsSubmitting(true);
      setSubmitPhase("posting");
      if (parentId) {
        setReplyFormError("");
      } else {
        setFormError("");
      }

      const result = await createComment.mutateAsync({ body: trimmed, parentId });
      const commentId = result.comment?._id;

      if (pendingFiles.length > 0 && commentId) {
        setSubmitPhase("uploading");
        await uploadPendingFiles(commentId, pendingFiles);
        queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      }

      reset?.();
      if (parentId) {
        setReplyPendingFiles([]);
        setReplyingTo(null);
      } else {
        setMainPendingFiles([]);
      }

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to post comment.";
      if (parentId) {
        setReplyFormError(message);
      } else {
        setFormError(message);
      }
      return false;
    } finally {
      setIsSubmitting(false);
      setSubmitPhase("idle");
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment.mutateAsync(commentId);
      if (replyingTo?._id === commentId) {
        setReplyingTo(null);
      }
    } catch {
      // surfaced via mutation toast
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

  const busy = createComment.isPending || isSubmitting;

  const content = (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-dashboard-accent-subtle/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dashboard-accent text-white shadow-sm">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {embedded ? "Discussion" : "Comments"}
            </h3>
            <p className="text-sm text-text-secondary">
              {totalComments === 0
                ? "Start the conversation with your team."
                : `${totalComments} message${totalComments === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? <CommentsSkeleton /> : null}

      {isError ? (
        <Alert variant="error">
          {error instanceof Error ? error.message : "Failed to load comments."}
        </Alert>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {!isClient ? (
            <CommentComposer
              taskId={taskId}
              placeholder="Share an update, ask a question, or @mention a teammate…"
              submitLabel="Post comment"
              onSubmit={submitComment}
              busy={busy}
              submitPhase={submitPhase}
              pendingFiles={mainPendingFiles}
              onAddFiles={(files) =>
                setMainPendingFiles((current) => [...current, ...files])
              }
              onRemoveFile={(index) =>
                setMainPendingFiles((current) =>
                  current.filter((_, i) => i !== index)
                )
              }
              onPreviewFile={(file) =>
                filePreview.openPreview(file, { type: "local", file })
              }
              formError={formError}
              members={members}
              currentUserId={user?.id}
            />
          ) : null}

          {commentTree.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-dashboard-accent/25 bg-dashboard-accent-subtle/30 px-6 py-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-dashboard-accent" />
              <p className="mt-3 text-sm font-medium text-text-primary">
                No comments yet
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {!isClient
                  ? "Be the first to share an update on this task."
                  : "Comments from your team will appear here."}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {commentTree.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  isClient={isClient}
                  canDeleteComment={canDeleteComment}
                  onDelete={handleDelete}
                  onReply={(target) => {
                    setReplyFormError("");
                    setReplyingTo(target);
                  }}
                  replyingToId={replyingTo?._id ?? null}
                  loadingId={loadingId}
                  onOpenAttachment={handleOpenAttachment}
                  deletePending={deleteComment.isPending}
                  taskId={taskId}
                  onSubmitReply={submitComment}
                  replyBusy={busy}
                  replySubmitPhase={submitPhase}
                  replyPendingFiles={replyPendingFiles}
                  onAddReplyFiles={(files) =>
                    setReplyPendingFiles((current) => [...current, ...files])
                  }
                  onRemoveReplyFile={(index) =>
                    setReplyPendingFiles((current) =>
                      current.filter((_, i) => i !== index)
                    )
                  }
                  onPreviewReplyFile={(file) =>
                    filePreview.openPreview(file, { type: "local", file })
                  }
                  replyFormError={replyFormError}
                  onCancelReply={() => {
                    setReplyingTo(null);
                    setReplyFormError("");
                    setReplyPendingFiles([]);
                  }}
                  members={members}
                  currentUserId={user?.id}
                />
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );

  return (
    <>
      {embedded ? content : <Card className="p-6">{content}</Card>}

      <FilePreviewDialog {...filePreview.dialogProps} />
    </>
  );
}

import { useRef } from "react";
import { format } from "date-fns";
import {
  File,
  FileImage,
  FileText,
  Paperclip,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { Toast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  useAttachments,
  useDeleteAttachment,
  useUploadAttachment,
} from "@/features/tasks/hooks/useAttachments";
import { useTaskCollaborationSocket } from "@/features/tasks/hooks/useTaskCollaborationSocket";
import { downloadAttachment } from "@/lib/attachmentsApi";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType) {
  if (mimeType?.startsWith("image/")) {
    return FileImage;
  }
  if (
    mimeType?.startsWith("text/") ||
    mimeType === "application/pdf" ||
    mimeType?.includes("document")
  ) {
    return FileText;
  }
  return File;
}

function AttachmentsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function TaskAttachments({ taskId, projectId }) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isClient = role === "client";
  const isElevated = role === "org_admin" || role === "project_manager";
  const fileInputRef = useRef(null);
  const { toast, showToast, dismissToast } = useToast();

  useTaskCollaborationSocket(projectId, taskId);

  const {
    data: attachments = [],
    isLoading,
    isError,
    error,
  } = useAttachments(taskId);
  const uploadAttachment = useUploadAttachment(taskId);
  const deleteAttachment = useDeleteAttachment(taskId);

  function canDeleteAttachment(attachment) {
    if (isElevated) return true;
    return (
      attachment.uploaderId === user?.id || attachment.uploader?.id === user?.id
    );
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showToast("File too large. Max size is 5MB.", "error");
      return;
    }

    try {
      await uploadAttachment.mutateAsync(file);
      showToast("File attached.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to upload file.",
        "error"
      );
    }
  }

  async function handleOpen(attachment) {
    try {
      const blob = await downloadAttachment(taskId, attachment._id);
      const typedBlob =
        blob.type || !attachment.mimeType
          ? blob
          : new Blob([blob], { type: attachment.mimeType });
      const objectUrl = URL.createObjectURL(typedBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = attachment.fileName || "download";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to open file.",
        "error"
      );
    }
  }

  async function handleDelete(attachmentId) {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
      showToast("Attachment removed.", "success");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete attachment.",
        "error"
      );
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Attachments
            </h3>
            <p className="text-sm text-text-secondary">
              Files stored with this task (max 5MB each).
            </p>
          </div>

          {!isClient ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAttachClick}
                isLoading={uploadAttachment.isPending}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach file
              </Button>
            </>
          ) : null}
        </div>

        {isLoading ? <AttachmentsSkeleton /> : null}

        {isError ? (
          <Alert variant="error">
            {error instanceof Error ? error.message : "Failed to load attachments."}
          </Alert>
        ) : null}

        {!isLoading && !isError ? (
          attachments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
              No files attached yet.
              {!isClient ? " Use Attach file to add one." : ""}
            </p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((attachment) => {
                const Icon = fileIcon(attachment.mimeType);

                return (
                  <li
                    key={attachment._id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface-raised/50 px-4 py-3"
                  >
                    <Icon className="h-5 w-5 shrink-0 text-text-muted" />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleOpen(attachment)}
                        className="truncate text-left text-sm font-medium text-primary hover:underline"
                      >
                        {attachment.fileName}
                      </button>
                      <p className="text-xs text-text-muted">
                        {formatFileSize(attachment.size)}
                        {attachment.uploader?.name
                          ? ` · ${attachment.uploader.name}`
                          : ""}
                        {attachment.createdAt
                          ? ` · ${format(new Date(attachment.createdAt), "MMM d, yyyy")}`
                          : ""}
                      </p>
                    </div>
                    {canDeleteAttachment(attachment) ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
                        aria-label="Delete attachment"
                        onClick={() => handleDelete(attachment._id)}
                        isLoading={deleteAttachment.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </Card>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

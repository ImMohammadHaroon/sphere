import { useRef, useState } from "react";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { AttachmentListItem } from "@/components/attachments/AttachmentListItem";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import { useFilePreview } from "@/hooks/useFilePreview";
import { attachmentMeta, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import {
  useDeleteMilestoneAttachment,
  useMilestoneAttachments,
  useUploadMilestoneAttachment,
} from "@/features/milestones/hooks/useMilestoneAttachments";

function AttachmentsSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function MilestoneAttachments({
  milestoneId,
  canUpload = false,
  compact = false,
}) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isElevated = role === "org_admin" || role === "project_manager";
  const fileInputRef = useRef(null);
  const [loadingId, setLoadingId] = useState(null);
  const filePreview = useFilePreview();

  const {
    data: attachments = [],
    isLoading,
    isError,
    error,
  } = useMilestoneAttachments(milestoneId);
  const uploadAttachment = useUploadMilestoneAttachment(milestoneId);
  const deleteAttachment = useDeleteMilestoneAttachment(milestoneId);

  function canDeleteAttachment(attachment) {
    if (!canUpload) return false;
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

    if (file.size > MAX_ATTACHMENT_SIZE) {
      toast.error("File too large. Max size is 5MB.");
      return;
    }

    try {
      await uploadAttachment.mutateAsync(file);
    } catch {
      // Mutation hook shows the error toast.
    }
  }

  async function handleOpen(attachment) {
    if (loadingId) {
      return;
    }

    setLoadingId(attachment._id);

    try {
      await filePreview.openPreview(attachment, {
        type: "milestone",
        milestoneId,
        attachmentId: attachment._id,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to open file.");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(attachmentId) {
    try {
      await deleteAttachment.mutateAsync(attachmentId);
    } catch {
      // Mutation hook shows the error toast.
    }
  }

  return (
    <>
      <div className={compact ? "mt-3" : ""}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Attachments
          </p>

          {canUpload ? (
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
                <Paperclip className="mr-2 h-3.5 w-3.5" />
                Attach file
              </Button>
            </>
          ) : null}
        </div>

        {isLoading ? <AttachmentsSkeleton /> : null}

        {isError ? (
          <Alert variant="error">
            {error instanceof Error
              ? error.message
              : "Failed to load attachments."}
          </Alert>
        ) : null}

        {!isLoading && !isError ? (
          attachments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">
              No files attached yet.
              {canUpload ? " Use Attach file to add deliverables." : ""}
            </p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((attachment) => {
                const meta = attachmentMeta(attachment);
                const isItemLoading = loadingId === attachment._id;

                return (
                  <AttachmentListItem
                    key={attachment._id}
                    attachment={attachment}
                    meta={meta}
                    isLoading={isItemLoading}
                    onOpen={() => handleOpen(attachment)}
                    onDelete={
                      canDeleteAttachment(attachment)
                        ? () => handleDelete(attachment._id)
                        : undefined
                    }
                    deleteLoading={deleteAttachment.isPending}
                    deleteDisabled={Boolean(loadingId)}
                  >
                    {attachment.uploader?.name
                      ? ` · ${attachment.uploader.name}`
                      : ""}
                    {attachment.createdAt
                      ? ` · ${format(new Date(attachment.createdAt), "MMM d, yyyy")}`
                      : ""}
                  </AttachmentListItem>
                );
              })}
            </ul>
          )
        ) : null}
      </div>

      <FilePreviewDialog {...filePreview.dialogProps} />
    </>
  );
}

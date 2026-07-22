import { downloadAttachment } from "@/lib/attachmentsApi";
import { downloadCommentAttachment } from "@/lib/commentAttachmentsApi";
import { downloadMilestoneAttachment } from "@/lib/milestoneAttachmentsApi";
import { toTypedBlob } from "@/lib/downloadBlob";

export async function fetchAttachmentBlob(source) {
  switch (source.type) {
    case "task":
      return downloadAttachment(source.taskId, source.attachmentId);
    case "comment":
      return downloadCommentAttachment(
        source.taskId,
        source.commentId,
        source.attachmentId
      );
    case "milestone":
      return downloadMilestoneAttachment(
        source.milestoneId,
        source.attachmentId
      );
    case "local":
      return source.file;
    default:
      throw new Error("Unknown attachment source.");
  }
}

export { toTypedBlob };

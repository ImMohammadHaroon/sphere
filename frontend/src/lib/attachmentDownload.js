import { downloadAttachment } from "@/lib/attachmentsApi";
import { downloadCommentAttachment } from "@/lib/commentAttachmentsApi";
import { downloadMilestoneAttachment } from "@/lib/milestoneAttachmentsApi";
import { downloadCommunityMessageAttachment } from "@/lib/communityAttachmentsApi";
import { downloadChatMessageAttachment } from "@/lib/chatAttachmentsApi";
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
    case "community":
      return downloadCommunityMessageAttachment(
        source.messageId,
        source.attachmentId
      );
    case "chat":
      return downloadChatMessageAttachment(
        source.roomId,
        source.messageId,
        source.attachmentId
      );
    case "local":
      return source.file;
    default:
      throw new Error("Unknown attachment source.");
  }
}

export { toTypedBlob };

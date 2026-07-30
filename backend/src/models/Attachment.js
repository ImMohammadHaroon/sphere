import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const attachmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
      index: true,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      default: null,
      index: true,
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    communityMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityMessage",
      default: null,
      index: true,
    },
    uploaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    // AES-256-GCM ciphertext — never store plaintext file bytes
    encryptedData: { type: Buffer, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true }
);

function hasValidAttachmentParent() {
  const hasTask = this.taskId != null;
  const hasMilestone = this.milestoneId != null;
  const hasComment = this.commentId != null;
  const hasCommunityMessage = this.communityMessageId != null;

  if (hasCommunityMessage) {
    return !hasTask && !hasMilestone && !hasComment;
  }

  if (hasMilestone) {
    return !hasTask && !hasComment;
  }

  if (hasComment) {
    return hasTask && !hasMilestone;
  }

  return hasTask && !hasMilestone && !hasComment;
}

const parentRefMessage =
  "Attachment must belong to a task, milestone, comment, or community message";

attachmentSchema.path("taskId").validate(hasValidAttachmentParent, parentRefMessage);
attachmentSchema
  .path("milestoneId")
  .validate(hasValidAttachmentParent, parentRefMessage);
attachmentSchema
  .path("commentId")
  .validate(hasValidAttachmentParent, parentRefMessage);
attachmentSchema
  .path("communityMessageId")
  .validate(hasValidAttachmentParent, parentRefMessage);

attachmentSchema.index({ organizationId: 1, taskId: 1 });
attachmentSchema.index({ organizationId: 1, milestoneId: 1 });
attachmentSchema.index({ organizationId: 1, commentId: 1 });
attachmentSchema.index({ organizationId: 1, communityMessageId: 1 });

export const Attachment = mongoose.model(
  "Attachment",
  attachmentSchema,
  COLLECTIONS.ATTACHMENTS
);

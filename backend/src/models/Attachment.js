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
      required: true,
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
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

attachmentSchema.index({ organizationId: 1, taskId: 1 });

export const Attachment = mongoose.model(
  "Attachment",
  attachmentSchema,
  COLLECTIONS.ATTACHMENTS
);

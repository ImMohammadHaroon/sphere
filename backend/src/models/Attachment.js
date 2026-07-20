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
    // AES-256-GCM ciphertext — never store plaintext file bytes
    encryptedData: { type: Buffer, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
  },
  { timestamps: true }
);

attachmentSchema.index({ organizationId: 1, taskId: 1 });

export const Attachment = mongoose.model(
  "Attachment",
  attachmentSchema,
  COLLECTIONS.ATTACHMENTS
);

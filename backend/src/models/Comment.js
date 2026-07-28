import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const commentSchema = new mongoose.Schema(
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
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: true }
);

commentSchema.index({ organizationId: 1, taskId: 1 });

export const Comment = mongoose.model(
  "Comment",
  commentSchema,
  COLLECTIONS.COMMENTS
);

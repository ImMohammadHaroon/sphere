import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const milestoneSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedByClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ organizationId: 1, projectId: 1 });
milestoneSchema.index({ projectId: 1, status: 1, dueDate: 1 });

export const Milestone = mongoose.model(
  "Milestone",
  milestoneSchema,
  COLLECTIONS.MILESTONES
);

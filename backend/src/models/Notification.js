import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

export const NOTIFICATION_TYPES = [
  "task_assigned",
  "task_moved",
  "invite_accepted",
  "org_registered",
  "milestone_created",
  "milestone_approved",
];

const notificationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model(
  "Notification",
  notificationSchema,
  COLLECTIONS.NOTIFICATIONS
);

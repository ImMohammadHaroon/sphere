import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const CHAT_ROOM_TYPES = ["community", "project", "direct"];

const chatRoomSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: CHAT_ROOM_TYPES,
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
    participantIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: "", maxlength: 200 },
  },
  { timestamps: true }
);

chatRoomSchema.index(
  { organizationId: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: "community" } }
);

chatRoomSchema.index(
  { organizationId: 1, projectId: 1 },
  { unique: true, partialFilterExpression: { type: "project" } }
);

chatRoomSchema.index({ organizationId: 1, participantIds: 1, type: 1 });

export const ChatRoom = mongoose.model(
  "ChatRoom",
  chatRoomSchema,
  COLLECTIONS.CHAT_ROOMS
);

export { CHAT_ROOM_TYPES };

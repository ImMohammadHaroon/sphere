import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const communityMessageSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      default: null,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    body: { type: String, trim: true, maxlength: 5000, default: "" },
  },
  { timestamps: true }
);

communityMessageSchema.index({ organizationId: 1, createdAt: -1 });
communityMessageSchema.index({ roomId: 1, createdAt: -1 });

export const CommunityMessage = mongoose.model(
  "CommunityMessage",
  communityMessageSchema,
  COLLECTIONS.COMMUNITY_MESSAGES
);

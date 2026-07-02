import mongoose from "mongoose";
import crypto from "crypto";

const inviteTokenSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["org_admin", "project_manager", "team_member", "client"],
      required: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inviteTokenSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const InviteToken = mongoose.model("InviteToken", inviteTokenSchema);

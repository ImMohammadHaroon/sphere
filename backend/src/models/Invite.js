import mongoose from "mongoose";

export const INVITE_ROLES = [
  "org_admin",
  "project_manager",
  "team_member",
  "client",
];

export const INVITE_STATUSES = ["pending", "accepted", "expired"];

const inviteSchema = new mongoose.Schema(
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
      enum: INVITE_ROLES,
      required: true,
    },
    token: { type: String, required: true, unique: true },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: INVITE_STATUSES,
      default: "pending",
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

inviteSchema.index({ organizationId: 1, email: 1, status: 1 });

export const Invite = mongoose.model("Invite", inviteSchema);

import mongoose from "mongoose";

export const ROLES = [
  "super_admin",
  "org_admin",
  "project_manager",
  "team_member",
  "client",
];

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return this.role !== "super_admin";
      },
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: "team_member",
    },
    publicKey: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.index({ organizationId: 1, email: 1 });

export const User = mongoose.model("User", userSchema);

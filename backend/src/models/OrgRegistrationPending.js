import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const orgRegistrationPendingSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    orgName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    verificationCodeHash: { type: String, required: true, select: false },
    verificationExpires: { type: Date, required: true, index: true },
    verificationAttempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const OrgRegistrationPending = mongoose.model(
  "OrgRegistrationPending",
  orgRegistrationPendingSchema,
  COLLECTIONS.ORG_REGISTRATION_PENDING
);

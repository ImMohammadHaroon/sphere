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
    selectedPlan: {
      type: String,
      enum: ["starter", "professional", "business"],
      default: "starter",
    },
    billingInterval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },
  },
  { timestamps: true }
);

export const OrgRegistrationPending = mongoose.model(
  "OrgRegistrationPending",
  orgRegistrationPendingSchema,
  COLLECTIONS.ORG_REGISTRATION_PENDING
);

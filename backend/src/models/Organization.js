import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const brandingSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: null },
    primaryColor: { type: String, default: "160 56% 28%" },
  },
  { _id: false }
);

const securitySchema = new mongoose.Schema(
  {
    passwordMinLength: { type: Number, default: 8, min: 6, max: 32 },
    require2FA: { type: Boolean, default: false },
  },
  { _id: false }
);

const invitePolicySchema = new mongoose.Schema(
  {
    defaultRole: {
      type: String,
      enum: ["project_manager", "team_member", "client"],
      default: "team_member",
    },
    inviteExpiryDays: { type: Number, default: 7, min: 1, max: 30 },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    branding: { type: brandingSchema, default: () => ({}) },
    timezone: { type: String, default: "UTC", trim: true },
    security: { type: securitySchema, default: () => ({}) },
    invitePolicy: { type: invitePolicySchema, default: () => ({}) },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    settings: {
      type: settingsSchema,
      default: () => ({}),
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema, COLLECTIONS.ORGANIZATIONS);

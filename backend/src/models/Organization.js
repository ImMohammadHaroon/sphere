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

const billingSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["starter", "professional", "business"],
      default: "starter",
    },
    interval: {
      type: String,
      enum: ["month", "year"],
      default: "month",
    },
    status: {
      type: String,
      enum: ["trialing", "active", "past_due", "canceled", "incomplete"],
      default: "trialing",
    },
    trialEndsAt: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    stripePriceId: { type: String, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    defaultPaymentMethodId: { type: String, default: null },
    paymentMethodLast4: { type: String, default: null },
    paymentMethodBrand: { type: String, default: null },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    settings: {
      type: settingsSchema,
      default: () => ({}),
    },
    billing: {
      type: billingSchema,
      default: () => ({}),
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    verificationReviewedAt: { type: Date, default: null },
    verificationReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verificationRejectionReason: {
      type: String,
      default: null,
      maxlength: 500,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema, COLLECTIONS.ORGANIZATIONS);

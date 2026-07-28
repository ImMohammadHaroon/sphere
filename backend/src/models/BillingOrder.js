import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";

const billingOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["plan_change", "subscription_start", "trial_start"],
      required: true,
    },
    plan: {
      type: String,
      enum: ["starter", "professional", "business"],
      required: true,
    },
    interval: {
      type: String,
      enum: ["month", "year"],
      required: true,
    },
    amountCents: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "usd" },
    status: {
      type: String,
      enum: ["scheduled", "open", "paid", "void"],
      default: "scheduled",
    },
    description: { type: String, required: true, trim: true },
    stripeInvoiceId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
  },
  { timestamps: true }
);

billingOrderSchema.index({ organizationId: 1, createdAt: -1 });

export const BillingOrder = mongoose.model(
  "BillingOrder",
  billingOrderSchema,
  COLLECTIONS.BILLING_ORDERS
);

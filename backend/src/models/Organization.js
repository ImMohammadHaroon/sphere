import mongoose from "mongoose";

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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model("Organization", organizationSchema);

import mongoose from "mongoose";

export const PLATFORM_SETTINGS_ID = new mongoose.Types.ObjectId(
  "000000000000000000000001"
);

const generalSchema = new mongoose.Schema(
  {
    platformName: { type: String, default: "ProjectSphere", trim: true },
    supportEmail: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    allowSelfServeSignup: { type: Boolean, default: true },
  },
  { _id: false }
);

const securitySchema = new mongoose.Schema(
  {
    globalPasswordMinLength: { type: Number, default: 8, min: 6, max: 32 },
    enforceGlobal2FA: { type: Boolean, default: false },
  },
  { _id: false }
);

const maintenanceSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    message: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => PLATFORM_SETTINGS_ID,
    },
    general: { type: generalSchema, default: () => ({}) },
    registration: { type: registrationSchema, default: () => ({}) },
    security: { type: securitySchema, default: () => ({}) },
    maintenance: { type: maintenanceSchema, default: () => ({}) },
  },
  { timestamps: true }
);

platformSettingsSchema.statics.getOrCreate = async function getOrCreate() {
  return this.findOneAndUpdate(
    { _id: PLATFORM_SETTINGS_ID },
    {},
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const PlatformSettings = mongoose.model(
  "PlatformSettings",
  platformSettingsSchema
);

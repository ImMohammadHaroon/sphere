import { z } from "zod";

const planIdSchema = z.enum(["starter", "professional", "business"]).optional();
const intervalSchema = z.enum(["month", "year"]).optional();

export const registerOrgSchema = z.object({
  body: z.object({
    orgName: z.string().min(2).max(100),
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number"),
    plan: planIdSchema,
    interval: intervalSchema,
  }),
});

export const verifyOrgRegistrationSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z
      .string()
      .length(6, "Code must be 6 digits")
      .regex(/^\d{6}$/, "Code must be 6 digits"),
    deviceId: z.string().uuid().optional(),
  }),
});

export const resendOrgVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    deviceId: z.string().uuid().optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    jobTitle: z
      .string()
      .trim()
      .max(80)
      .optional()
      .nullable()
      .transform((value) => (value === "" ? null : value)),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
  }),
});

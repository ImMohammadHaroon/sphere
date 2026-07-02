import { z } from "zod";

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
    deviceId: z.string().uuid().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
    deviceId: z.string().uuid().optional(),
  }),
});

export const inviteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["org_admin", "project_manager", "team_member", "client"]),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    name: z.string().min(2).max(100),
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/, "Must contain uppercase")
      .regex(/[a-z]/, "Must contain lowercase")
      .regex(/[0-9]/, "Must contain number"),
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

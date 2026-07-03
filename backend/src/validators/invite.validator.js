import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Must contain uppercase")
  .regex(/[a-z]/, "Must contain lowercase")
  .regex(/[0-9]/, "Must contain number");

export const createInviteSchema = z.object({
  body: z.object({
    email: z.string().email(),
    role: z.enum(["org_admin", "project_manager", "team_member", "client"]),
  }),
});

export const inviteIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid invite id"),
  }),
});

export const inviteTokenParamSchema = z.object({
  params: z.object({
    token: z.string().min(1),
  }),
});

export const acceptInviteSchema = z.object({
  params: z.object({
    token: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(2).max(100),
    password: passwordSchema,
    deviceId: z.string().uuid().optional(),
  }),
});

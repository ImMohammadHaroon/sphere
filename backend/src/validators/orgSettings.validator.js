import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const brandingSchema = z
  .object({
    logoUrl: z.union([z.string().url(), z.null()]),
    primaryColor: z.string().trim().min(1).max(64),
  })
  .strict();

export const updateGeneralSettingsSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      slug: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .regex(slugPattern, "Slug must be lowercase letters, numbers, and hyphens"),
      branding: brandingSchema,
      timezone: z.string().trim().min(1).max(64),
    })
    .strict(),
});

export const updateSecuritySettingsSchema = z.object({
  body: z
    .object({
      security: z
        .object({
          passwordMinLength: z.number().int().min(6).max(32),
          require2FA: z.boolean(),
        })
        .strict(),
    })
    .strict(),
});

export const updateInvitePolicySchema = z.object({
  body: z
    .object({
      invitePolicy: z
        .object({
          defaultRole: z.enum(["project_manager", "team_member", "client"]),
          inviteExpiryDays: z.number().int().min(1).max(30),
        })
        .strict(),
    })
    .strict(),
});

export const deactivateOrgSchema = z.object({
  body: z
    .object({
      confirmSlug: z.string().trim().min(1),
    })
    .strict(),
});

export const deleteOrgSchema = deactivateOrgSchema;

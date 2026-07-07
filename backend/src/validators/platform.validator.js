import { z } from "zod";
import { ROLES } from "../models/User.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listOrganizationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().trim().optional(),
      plan: z.enum(["free", "pro", "enterprise"]).optional(),
      isActive: z.enum(["true", "false"]).optional(),
    })
    .strict(),
});

export const organizationIdParamSchema = z.object({
  params: z
    .object({
      id: objectId,
    })
    .strict(),
});

export const listPendingOrganizationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
});

export const rejectOrganizationSchema = z.object({
  params: z
    .object({
      id: objectId,
    })
    .strict(),
  body: z
    .object({
      reason: z.string().trim().max(500).optional(),
    })
    .strict(),
});

export const deleteOrganizationSchema = z.object({
  params: z
    .object({
      id: objectId,
    })
    .strict(),
  body: z
    .object({
      confirmSlug: z.string().trim().min(1),
    })
    .strict(),
});

export const listAllUsersQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().trim().optional(),
      role: z.enum(ROLES).optional(),
      organizationId: objectId.optional(),
    })
    .strict(),
});

export const listPlatformAuditLogsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional().default(1),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      action: z.string().trim().min(1).optional(),
      organizationId: objectId.optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    })
    .strict(),
});

export const updateGeneralSettingsSchema = z.object({
  body: z
    .object({
      general: z
        .object({
          platformName: z.string().trim().min(1).max(200),
          supportEmail: z.string().trim().max(320),
        })
        .strict(),
    })
    .strict(),
});

export const updateRegistrationSettingsSchema = z.object({
  body: z
    .object({
      registration: z
        .object({
          allowSelfServeSignup: z.boolean(),
          defaultPlan: z.enum(["free", "pro", "enterprise"]),
        })
        .strict(),
    })
    .strict(),
});

export const updateSecuritySettingsSchema = z.object({
  body: z
    .object({
      security: z
        .object({
          globalPasswordMinLength: z.number().int().min(6).max(32),
          enforceGlobal2FA: z.boolean(),
        })
        .strict(),
    })
    .strict(),
});

export const updateMaintenanceSettingsSchema = z.object({
  body: z
    .object({
      maintenance: z
        .object({
          enabled: z.boolean(),
          message: z.string().trim().max(2000),
        })
        .strict(),
    })
    .strict(),
});

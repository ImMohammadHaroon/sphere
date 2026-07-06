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

import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listPlatformProjectsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().trim().optional(),
      organizationId: objectId.optional(),
    })
    .strict(),
});

export const platformProjectReportParamSchema = z.object({
  params: z
    .object({
      id: objectId,
    })
    .strict(),
});

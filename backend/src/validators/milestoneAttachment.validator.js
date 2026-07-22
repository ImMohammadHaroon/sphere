import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const milestoneIdParamSchema = z.object({
  params: z.object({
    milestoneId: objectId,
    projectId: objectId.optional(),
  }),
});

export const milestoneAttachmentIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    milestoneId: objectId,
    projectId: objectId.optional(),
  }),
});

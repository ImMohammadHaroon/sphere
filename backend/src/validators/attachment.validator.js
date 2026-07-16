import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const attachmentIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    taskId: objectId,
    projectId: objectId.optional(),
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    taskId: objectId,
    projectId: objectId.optional(),
  }),
});

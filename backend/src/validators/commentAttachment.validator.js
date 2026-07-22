import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const commentIdParamSchema = z.object({
  params: z.object({
    commentId: objectId,
    taskId: objectId,
    projectId: objectId.optional(),
  }),
});

export const commentAttachmentIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    commentId: objectId,
    taskId: objectId,
    projectId: objectId.optional(),
  }),
});

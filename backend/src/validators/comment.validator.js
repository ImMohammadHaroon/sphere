import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createCommentSchema = z.object({
  params: z.object({
    taskId: objectId,
    projectId: objectId.optional(),
  }),
  body: z
    .object({
      body: z.string().trim().min(1).max(5000),
    })
    .strict(),
});

export const commentIdParamSchema = z.object({
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

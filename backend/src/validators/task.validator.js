import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createTaskSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(300),
      description: z.string().trim().max(10000).optional(),
      status: z.string().optional(),
      assigneeId: objectId.optional().nullable(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.coerce.date().optional().nullable(),
      position: z.number().optional(),
    })
    .strict(),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      title: z.string().trim().min(1).max(300).optional(),
      description: z.string().trim().max(10000).optional(),
      status: z.string().optional(),
      assigneeId: objectId.optional().nullable(),
      priority: z.enum(["low", "medium", "high"]).optional(),
      dueDate: z.coerce.date().optional().nullable(),
      position: z.number().optional(),
    })
    .strict(),
});

export const listTasksParamSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
});

export const taskIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const moveTaskSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      status: z.string().optional(),
      position: z.number().optional(),
    })
    .strict()
    .refine(
      (body) => body.status !== undefined || body.position !== undefined,
      { message: "At least one of status or position is required" }
    ),
});

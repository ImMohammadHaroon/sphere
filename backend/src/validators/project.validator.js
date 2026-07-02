import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createProjectSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().max(5000).optional(),
      startDate: z.coerce.date().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
    })
    .strict(),
});

export const updateProjectSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(5000).optional(),
      status: z.enum(["active", "archived"]).optional(),
      dueDate: z.coerce.date().optional().nullable(),
    })
    .strict(),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

import { z } from "zod";
import { columnInputSchema } from "./kanbanTemplate.validator.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createProjectSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      description: z.string().trim().max(5000).optional(),
      startDate: z.coerce.date().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      kanbanTemplateId: objectId.optional(),
      newTemplate: z
        .object({
          name: z.string().trim().min(1).max(200),
          columns: z.array(columnInputSchema).min(1),
        })
        .optional(),
    })
    .strict()
    .refine((body) => !(body.kanbanTemplateId && body.newTemplate), {
      message: "Provide kanbanTemplateId or newTemplate, not both",
    }),
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

export const projectCalendarSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  query: z
    .object({
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
    })
    .strict(),
});

export const addMemberSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      userId: objectId,
    })
    .strict(),
});

export const removeMemberSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      userId: objectId,
    })
    .strict(),
});

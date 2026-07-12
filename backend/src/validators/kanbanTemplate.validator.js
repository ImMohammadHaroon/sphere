import { z } from "zod";
import { KANBAN_COLUMN_COLORS } from "../services/kanbanTemplate.service.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const columnInputSchema = z.object({
  name: z.string().trim().min(1),
  color: z.enum(KANBAN_COLUMN_COLORS),
  isDone: z.boolean().optional(),
});

export const createKanbanTemplateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      columns: z.array(columnInputSchema).min(1),
    })
    .strict(),
});

export const updateKanbanTemplateSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z
    .object({
      name: z.string().trim().min(1).max(200),
      columns: z.array(columnInputSchema).min(1),
    })
    .strict(),
});

export const kanbanTemplateIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

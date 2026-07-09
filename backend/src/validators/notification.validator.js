import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const listNotificationsQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional().default(1),
    })
    .strict(),
});

export const notificationIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

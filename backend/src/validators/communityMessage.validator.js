import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const createCommunityMessageSchema = z.object({
  body: z
    .object({
      body: z.string().max(5000).optional().default(""),
    })
    .strict(),
});

export const communityMessageIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const listCommunityMessagesSchema = z.object({
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      before: objectId.optional(),
    })
    .optional(),
});

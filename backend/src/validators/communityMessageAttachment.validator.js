import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const communityMessageIdParamSchema = z.object({
  params: z.object({
    messageId: objectId,
  }),
});

export const communityMessageAttachmentIdParamSchema = z.object({
  params: z.object({
    id: objectId,
    messageId: objectId,
  }),
});

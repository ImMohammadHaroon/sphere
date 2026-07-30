import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const chatDirectorySchema = z.object({
  query: z
    .object({
      q: z.string().max(100).optional().default(""),
      limit: z.coerce.number().int().min(1).max(50).optional(),
    })
    .optional(),
});

export const createDirectRoomSchema = z.object({
  body: z
    .object({
      userId: objectId,
    })
    .strict(),
});

export const roomIdParamSchema = z.object({
  params: z.object({
    roomId: objectId,
  }),
});

export const projectIdParamSchema = z.object({
  params: z.object({
    projectId: objectId,
  }),
});

export const listRoomMessagesSchema = z.object({
  params: z.object({
    roomId: objectId,
  }),
  query: z
    .object({
      limit: z.coerce.number().int().min(1).max(100).optional(),
      before: objectId.optional(),
    })
    .optional(),
});

export const createRoomMessageSchema = z.object({
  params: z.object({
    roomId: objectId,
  }),
  body: z
    .object({
      body: z.string().max(5000).optional().default(""),
    })
    .strict(),
});

export const roomMessageIdParamSchema = z.object({
  params: z.object({
    roomId: objectId,
    id: objectId,
  }),
});

export const roomMessageIdParamForAttachmentSchema = z.object({
  params: z.object({
    roomId: objectId,
    messageId: objectId,
  }),
});

export const roomMessageAttachmentIdParamSchema = z.object({
  params: z.object({
    roomId: objectId,
    messageId: objectId,
    id: objectId,
  }),
});

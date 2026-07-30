import { Router } from "express";
import * as chatController from "../controllers/chat.controller.js";
import * as chatAttachmentController from "../controllers/chatAttachment.controller.js";
import { upload } from "../config/upload.js";
import { attachmentDownloadRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  chatDirectorySchema,
  createDirectRoomSchema,
  createRoomMessageSchema,
  listRoomMessagesSchema,
  projectIdParamSchema,
  roomIdParamSchema,
  roomMessageIdParamSchema,
  roomMessageAttachmentIdParamSchema,
  roomMessageIdParamForAttachmentSchema,
} from "../validators/chat.validator.js";

const router = Router();

router.get("/rooms", chatController.listChatRooms);
router.get("/directory", validate(chatDirectorySchema), chatController.searchChatDirectory);
router.post(
  "/rooms/direct",
  validate(createDirectRoomSchema),
  chatController.createDirectRoom
);
router.get("/rooms/community", chatController.getCommunityRoomId);
router.get(
  "/rooms/project/:projectId",
  validate(projectIdParamSchema),
  chatController.getProjectRoomId
);
router.get(
  "/rooms/:roomId",
  validate(roomIdParamSchema),
  chatController.getChatRoom
);
router.get(
  "/rooms/:roomId/messages",
  validate(listRoomMessagesSchema),
  chatController.listRoomMessages
);
router.post(
  "/rooms/:roomId/messages",
  validate(createRoomMessageSchema),
  chatController.createRoomMessage
);
router.delete(
  "/rooms/:roomId/messages/:id",
  validate(roomMessageIdParamSchema),
  chatController.deleteRoomMessage
);

router.post(
  "/rooms/:roomId/messages/:messageId/attachments",
  validate(roomMessageIdParamForAttachmentSchema),
  upload.single("file"),
  chatAttachmentController.uploadChatMessageAttachment
);
router.get(
  "/rooms/:roomId/messages/:messageId/attachments/:id/download",
  attachmentDownloadRateLimiter,
  validate(roomMessageAttachmentIdParamSchema),
  chatAttachmentController.downloadChatMessageAttachment
);
router.delete(
  "/rooms/:roomId/messages/:messageId/attachments/:id",
  validate(roomMessageAttachmentIdParamSchema),
  chatAttachmentController.deleteChatMessageAttachment
);

export default router;

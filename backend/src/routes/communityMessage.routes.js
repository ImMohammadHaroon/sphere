import { Router } from "express";
import * as communityMessageController from "../controllers/communityMessage.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCommunityMessageSchema,
  communityMessageIdParamSchema,
  listCommunityMessagesSchema,
} from "../validators/communityMessage.validator.js";

const router = Router();

router.get(
  "/",
  validate(listCommunityMessagesSchema),
  communityMessageController.listCommunityMessages
);

router.post(
  "/",
  validate(createCommunityMessageSchema),
  communityMessageController.createCommunityMessage
);

router.delete(
  "/:id",
  validate(communityMessageIdParamSchema),
  communityMessageController.deleteCommunityMessage
);

export default router;

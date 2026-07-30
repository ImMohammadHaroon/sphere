import { Router } from "express";
import * as communityMessageAttachmentController from "../controllers/communityMessageAttachment.controller.js";
import { upload } from "../config/upload.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  communityMessageIdParamSchema,
  communityMessageAttachmentIdParamSchema,
} from "../validators/communityMessageAttachment.validator.js";

const router = Router({ mergeParams: true });

router.post(
  "/",
  validate(communityMessageIdParamSchema),
  upload.single("file"),
  communityMessageAttachmentController.uploadCommunityMessageAttachment
);

router.get(
  "/:id/download",
  validate(communityMessageAttachmentIdParamSchema),
  communityMessageAttachmentController.downloadCommunityMessageAttachment
);

router.delete(
  "/:id",
  validate(communityMessageAttachmentIdParamSchema),
  communityMessageAttachmentController.deleteCommunityMessageAttachment
);

export default router;

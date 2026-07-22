import { Router } from "express";
import * as commentAttachmentController from "../controllers/commentAttachment.controller.js";
import { upload } from "../config/upload.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { requireOwnershipOrRole } from "../middleware/requireOwnershipOrRole.js";
import { loadCommentAttachment } from "../middleware/rbac.loaders.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  commentAttachmentIdParamSchema,
  commentIdParamSchema,
} from "../validators/commentAttachment.validator.js";

const commentAttachmentUploadRoles = requireRole([
  "org_admin",
  "project_manager",
  "team_member",
]);
const commentAttachmentDeleteAccess = requireOwnershipOrRole(
  loadCommentAttachment,
  ["org_admin", "project_manager"],
  "uploaderId"
);

function createCommentAttachmentRouter() {
  const router = Router({ mergeParams: true });

  router.post(
    "/",
    commentAttachmentUploadRoles,
    validate(commentIdParamSchema),
    upload.single("file"),
    commentAttachmentController.uploadCommentAttachment
  );

  router.get(
    "/:id/download",
    validate(commentAttachmentIdParamSchema),
    commentAttachmentController.downloadCommentAttachment
  );

  router.delete(
    "/:id",
    validate(commentAttachmentIdParamSchema),
    commentAttachmentDeleteAccess,
    commentAttachmentController.deleteCommentAttachment
  );

  return router;
}

export const projectTaskCommentAttachmentRouter =
  createCommentAttachmentRouter();
export const taskCommentAttachmentRouter = createCommentAttachmentRouter();

export default taskCommentAttachmentRouter;

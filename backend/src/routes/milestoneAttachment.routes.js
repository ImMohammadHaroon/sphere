import { Router } from "express";
import * as milestoneAttachmentController from "../controllers/milestoneAttachment.controller.js";
import { upload } from "../config/upload.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { requireOwnershipOrRole } from "../middleware/requireOwnershipOrRole.js";
import { loadMilestoneAttachment } from "../middleware/rbac.loaders.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  milestoneAttachmentIdParamSchema,
  milestoneIdParamSchema,
} from "../validators/milestoneAttachment.validator.js";

const milestoneAttachmentUploadRoles = requireRole([
  "org_admin",
  "project_manager",
]);
const milestoneAttachmentDeleteAccess = requireOwnershipOrRole(
  loadMilestoneAttachment,
  ["org_admin", "project_manager"],
  "uploaderId"
);

function createMilestoneAttachmentRouter() {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validate(milestoneIdParamSchema),
    milestoneAttachmentController.listMilestoneAttachments
  );

  router.post(
    "/",
    milestoneAttachmentUploadRoles,
    validate(milestoneIdParamSchema),
    upload.single("file"),
    milestoneAttachmentController.uploadMilestoneAttachment
  );

  router.get(
    "/:id/download",
    validate(milestoneAttachmentIdParamSchema),
    milestoneAttachmentController.downloadMilestoneAttachment
  );

  router.delete(
    "/:id",
    validate(milestoneAttachmentIdParamSchema),
    milestoneAttachmentDeleteAccess,
    milestoneAttachmentController.deleteMilestoneAttachment
  );

  return router;
}

export const projectMilestoneAttachmentRouter =
  createMilestoneAttachmentRouter();
export const milestoneAttachmentRouter = createMilestoneAttachmentRouter();

export default milestoneAttachmentRouter;

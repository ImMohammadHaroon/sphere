import { Router } from "express";
import * as attachmentController from "../controllers/attachment.controller.js";
import { upload } from "../config/upload.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { requireOwnershipOrRole } from "../middleware/requireOwnershipOrRole.js";
import { loadAttachment } from "../middleware/rbac.loaders.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  attachmentIdParamSchema,
  taskIdParamSchema,
} from "../validators/attachment.validator.js";

const attachmentUploadRoles = requireRole([
  "org_admin",
  "project_manager",
  "team_member",
]);
const attachmentDeleteAccess = requireOwnershipOrRole(
  loadAttachment,
  ["org_admin", "project_manager"],
  "uploaderId"
);

function createAttachmentRouter() {
  const router = Router({ mergeParams: true });

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/attachments:
   *   get:
   *     summary: List attachment metadata for a task (tenant-scoped)
   *     tags: [Attachments]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: List of attachment metadata (no file bytes)
   *       404:
   *         description: Task not found
   */
  router.get(
    "/",
    validate(taskIdParamSchema),
    attachmentController.listAttachments
  );

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/attachments:
   *   post:
   *     summary: Upload a file attachment to a task (tenant-scoped)
   *     tags: [Attachments]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema: { type: string }
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       201:
   *         description: Attachment uploaded
   *       400:
   *         description: No file or file too large (max 5MB)
   *       403:
   *         description: Forbidden — client role cannot upload
   *       404:
   *         description: Task not found
   */
  router.post(
    "/",
    attachmentUploadRoles,
    validate(taskIdParamSchema),
    upload.single("file"),
    attachmentController.uploadAttachment
  );

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/attachments/{id}/download:
   *   get:
   *     summary: Download or view an attachment file (tenant-scoped)
   *     tags: [Attachments]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: File bytes
   *         content:
   *           application/octet-stream:
   *             schema:
   *               type: string
   *               format: binary
   *       404:
   *         description: Not found
   */
  router.get(
    "/:id/download",
    validate(attachmentIdParamSchema),
    attachmentController.downloadAttachment
  );

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/attachments/{id}:
   *   delete:
   *     summary: Delete an attachment (uploader or PM/org admin)
   *     tags: [Attachments]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: projectId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema: { type: string }
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Attachment deleted
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Not found
   */
  router.delete(
    "/:id",
    validate(attachmentIdParamSchema),
    attachmentDeleteAccess,
    attachmentController.deleteAttachment
  );

  return router;
}

export const projectTaskAttachmentRouter = createAttachmentRouter();
export const taskAttachmentRouter = createAttachmentRouter();

export default taskAttachmentRouter;

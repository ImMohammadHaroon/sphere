import { Router } from "express";
import * as commentController from "../controllers/comment.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { requireOwnershipOrRole } from "../middleware/requireOwnershipOrRole.js";
import { loadComment } from "../middleware/rbac.loaders.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createCommentSchema,
  commentIdParamSchema,
  taskIdParamSchema,
} from "../validators/comment.validator.js";

const commentCreateRoles = requireRole([
  "org_admin",
  "project_manager",
  "team_member",
]);
const commentDeleteAccess = requireOwnershipOrRole(
  loadComment,
  ["org_admin", "project_manager"],
  "authorId"
);

function createCommentRouter() {
  const router = Router({ mergeParams: true });

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/comments:
   *   get:
   *     summary: List comments for a task (tenant-scoped)
   *     tags: [Comments]
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
   *         description: List of comments
   *       404:
   *         description: Task not found
   */
  router.get(
    "/",
    validate(taskIdParamSchema),
    commentController.listComments
  );

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/comments:
   *   post:
   *     summary: Add a comment to a task (tenant-scoped)
   *     tags: [Comments]
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
   *         application/json:
   *           schema:
   *             type: object
   *             required: [body]
   *             properties:
   *               body: { type: string, maxLength: 5000 }
   *     responses:
   *       201:
   *         description: Comment created
   *       403:
   *         description: Forbidden — client role cannot comment
   *       404:
   *         description: Task not found
   */
  router.post(
    "/",
    commentCreateRoles,
    validate(createCommentSchema),
    commentController.createComment
  );

  /**
   * @openapi
   * /projects/{projectId}/tasks/{taskId}/comments/{id}:
   *   delete:
   *     summary: Delete a comment (author or PM/org admin)
   *     tags: [Comments]
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
   *         description: Comment deleted
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Not found
   */
  router.delete(
    "/:id",
    validate(commentIdParamSchema),
    commentDeleteAccess,
    commentController.deleteComment
  );

  return router;
}

export const projectTaskCommentRouter = createCommentRouter();
export const taskCommentRouter = createCommentRouter();

export default taskCommentRouter;

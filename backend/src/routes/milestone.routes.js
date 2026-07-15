import { Router } from "express";
import * as milestoneController from "../controllers/milestone.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  approveMilestoneSchema,
  listMilestonesParamSchema,
  milestoneIdParamSchema,
} from "../validators/milestone.validator.js";

const milestoneManageRoles = requireRole(["org_admin", "project_manager"]);
const milestoneApproveRoles = requireRole(["client"]);

export const projectMilestoneRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /projects/{projectId}/milestones:
 *   get:
 *     summary: List milestones for a project (tenant-scoped, project members)
 *     tags: [Milestones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of milestones
 *       404:
 *         description: Project not found
 */
projectMilestoneRouter.get(
  "/",
  validate(listMilestonesParamSchema),
  milestoneController.listMilestones
);

/**
 * @openapi
 * /projects/{projectId}/milestones:
 *   post:
 *     summary: Create a milestone under a project (tenant-scoped)
 *     tags: [Milestones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, dueDate]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Milestone created
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Project not found
 */
projectMilestoneRouter.post(
  "/",
  milestoneManageRoles,
  validate(createMilestoneSchema),
  milestoneController.createMilestone
);

const milestoneRouter = Router();

/**
 * @openapi
 * /milestones/{id}/approve:
 *   patch:
 *     summary: Approve or reject a milestone (client members only)
 *     tags: [Milestones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [decision]
 *             properties:
 *               decision: { type: string, enum: [approved, rejected] }
 *     responses:
 *       200:
 *         description: Milestone decision recorded
 *       403:
 *         description: Forbidden — client is not a project member
 *       404:
 *         description: Not found
 *       409:
 *         description: Milestone is not pending
 */
milestoneRouter.patch(
  "/:id/approve",
  validate(approveMilestoneSchema),
  milestoneApproveRoles,
  milestoneController.approveMilestone
);

/**
 * @openapi
 * /milestones/{id}:
 *   patch:
 *     summary: Update a pending milestone (tenant-scoped)
 *     tags: [Milestones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Milestone updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Milestone is not pending
 */
milestoneRouter.patch(
  "/:id",
  validate(updateMilestoneSchema),
  milestoneManageRoles,
  milestoneController.updateMilestone
);

/**
 * @openapi
 * /milestones/{id}:
 *   delete:
 *     summary: Delete a pending milestone (tenant-scoped)
 *     tags: [Milestones]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Milestone deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       409:
 *         description: Milestone is not pending
 */
milestoneRouter.delete(
  "/:id",
  validate(milestoneIdParamSchema),
  milestoneManageRoles,
  milestoneController.deleteMilestone
);

export default milestoneRouter;

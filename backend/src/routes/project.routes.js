import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  addMemberSchema,
  removeMemberSchema,
} from "../validators/project.validator.js";

const router = Router();

const projectWriteRoles = requireRole(["org_admin", "project_manager"]);

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List projects in the authenticated user's organization
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of projects (org_admin sees all; others see owned or member projects)
 */
router.get("/", projectController.listProjects);

/**
 * @openapi
 * /projects:
 *   post:
 *     summary: Create a project in the authenticated user's organization
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               startDate: { type: string, format: date-time }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Project created
 *       403:
 *         description: Forbidden — requires org_admin or project_manager role
 */
router.post(
  "/",
  projectWriteRoles,
  validate(createProjectSchema),
  projectController.createProject
);

/**
 * @openapi
 * /projects/{id}:
 *   get:
 *     summary: Get a project by id (tenant-scoped)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project details with populated members
 *       404:
 *         description: Not found
 */
router.get("/:id", validate(projectIdParamSchema), projectController.getProject);

/**
 * @openapi
 * /projects/{id}/members:
 *   get:
 *     summary: List assignable project members
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project members who can be assigned tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       email: { type: string }
 *                       role: { type: string }
 *       404:
 *         description: Not found
 */
router.get(
  "/:id/members",
  validate(projectIdParamSchema),
  projectController.listProjectMembers
);

/**
 * @openapi
 * /projects/{id}:
 *   patch:
 *     summary: Update a project (name, description, status, dueDate)
 *     tags: [Projects]
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
 *               status: { type: string, enum: [active, archived] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Project updated
 *       403:
 *         description: Forbidden — requires org_admin or project_manager role
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id",
  projectWriteRoles,
  validate(updateProjectSchema),
  projectController.updateProject
);

/**
 * @openapi
 * /projects/{id}/members:
 *   patch:
 *     summary: Add a member to a project
 *     tags: [Projects]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: Member added
 *       403:
 *         description: Forbidden — requires org_admin or project_manager role
 *       404:
 *         description: Project or user not found
 */
router.patch(
  "/:id/members",
  projectWriteRoles,
  validate(addMemberSchema),
  projectController.addProjectMember
);

/**
 * @openapi
 * /projects/{id}/members/remove:
 *   patch:
 *     summary: Remove a member from a project
 *     tags: [Projects]
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
 *             required: [userId]
 *             properties:
 *               userId: { type: string }
 *     responses:
 *       200:
 *         description: Member removed
 *       400:
 *         description: Cannot remove project owner
 *       403:
 *         description: Forbidden — requires org_admin or project_manager role
 *       404:
 *         description: Project not found
 */
router.patch(
  "/:id/members/remove",
  projectWriteRoles,
  validate(removeMemberSchema),
  projectController.removeProjectMember
);

/**
 * @openapi
 * /projects/{id}:
 *   delete:
 *     summary: Archive a project (soft delete)
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project archived
 *       403:
 *         description: Forbidden — requires org_admin or project_manager role
 *       404:
 *         description: Not found
 */
router.delete(
  "/:id",
  projectWriteRoles,
  validate(projectIdParamSchema),
  projectController.archiveProject
);

export default router;

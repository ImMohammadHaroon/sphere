import { Router } from "express";
import * as projectController from "../controllers/project.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
} from "../validators/project.validator.js";

const router = Router();

/**
 * @openapi
 * /projects:
 *   get:
 *     summary: List projects in the authenticated user's organization
 *     tags: [Projects]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of projects
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
 */
router.post("/", validate(createProjectSchema), projectController.createProject);

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
 *         description: Project details
 *       404:
 *         description: Not found
 */
router.get("/:id", validate(projectIdParamSchema), projectController.getProject);

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
 *       404:
 *         description: Not found
 */
router.patch(
  "/:id",
  validate(updateProjectSchema),
  projectController.updateProject
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
 *       404:
 *         description: Not found
 */
router.delete(
  "/:id",
  validate(projectIdParamSchema),
  projectController.archiveProject
);

export default router;

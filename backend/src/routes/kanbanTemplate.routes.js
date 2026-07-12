import { Router } from "express";
import * as kanbanTemplateController from "../controllers/kanbanTemplate.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createKanbanTemplateSchema,
  updateKanbanTemplateSchema,
  kanbanTemplateIdParamSchema,
} from "../validators/kanbanTemplate.validator.js";

const router = Router();

const templateWriteRoles = requireRole(["org_admin", "project_manager"]);

/**
 * @openapi
 * /kanban-templates:
 *   get:
 *     summary: List Kanban templates for the authenticated user's organization
 *     tags: [Kanban Templates]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of Kanban templates
 */
router.get("/", kanbanTemplateController.listTemplates);

/**
 * @openapi
 * /kanban-templates/{id}:
 *   get:
 *     summary: Get a Kanban template by id
 *     tags: [Kanban Templates]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Kanban template
 *       404:
 *         description: Not found
 */
router.get(
  "/:id",
  validate(kanbanTemplateIdParamSchema),
  kanbanTemplateController.getTemplate
);

/**
 * @openapi
 * /kanban-templates:
 *   post:
 *     summary: Create a Kanban template
 *     tags: [Kanban Templates]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, columns]
 *             properties:
 *               name: { type: string }
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, color]
 *                   properties:
 *                     name: { type: string }
 *                     color:
 *                       type: string
 *                       enum: [gray, amber, orange, green, blue, purple, red]
 *                     isDone: { type: boolean }
 *     responses:
 *       201:
 *         description: Template created
 */
router.post(
  "/",
  templateWriteRoles,
  validate(createKanbanTemplateSchema),
  kanbanTemplateController.createTemplate
);

/**
 * @openapi
 * /kanban-templates/{id}:
 *   patch:
 *     summary: Update a Kanban template
 *     tags: [Kanban Templates]
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
 *             required: [name, columns]
 *             properties:
 *               name: { type: string }
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name, color]
 *                   properties:
 *                     name: { type: string }
 *                     color:
 *                       type: string
 *                       enum: [gray, amber, orange, green, blue, purple, red]
 *                     isDone: { type: boolean }
 *     responses:
 *       200:
 *         description: Template updated
 */
router.patch(
  "/:id",
  templateWriteRoles,
  validate(updateKanbanTemplateSchema),
  kanbanTemplateController.updateTemplate
);

/**
 * @openapi
 * /kanban-templates/{id}:
 *   delete:
 *     summary: Delete a Kanban template
 *     tags: [Kanban Templates]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Template deleted
 *       409:
 *         description: Template is in use by projects
 */
router.delete(
  "/:id",
  templateWriteRoles,
  validate(kanbanTemplateIdParamSchema),
  kanbanTemplateController.deleteTemplate
);

export default router;

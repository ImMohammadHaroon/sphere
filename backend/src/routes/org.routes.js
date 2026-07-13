import { Router } from "express";
import * as orgController from "../controllers/org.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { orgUserIdParamSchema, updateUserRoleSchema } from "../validators/org.validator.js";

const router = Router();

const orgAdminOnly = requireRole(["org_admin"]);
const orgUserListRoles = requireRole(["org_admin", "project_manager"]);

/**
 * @openapi
 * /org/reports/overview:
 *   get:
 *     summary: Organization overview metrics for the authenticated org admin
 *     tags: [Organization]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Organization-scoped overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     active: { type: integer }
 *                     archived: { type: integer }
 *                 teamSize: { type: integer }
 *                 tasksByStatus:
 *                   type: object
 *                   properties:
 *                     todo: { type: integer }
 *                     in-progress: { type: integer }
 *                     review: { type: integer }
 *                     done: { type: integer }
 *                 recentProjects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       status: { type: string, enum: [active, archived] }
 *                       updatedAt: { type: string, format: date-time }
 *       403:
 *         description: Forbidden  requires org_admin role
 */
router.get(
  "/reports/overview",
  orgAdminOnly,
  orgController.getOrgOverview
);

/**
 * @openapi
 * /org/users:
 *   get:
 *     summary: List users in the authenticated user's organization
 *     tags: [Organization]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Organization users
 *       403:
 *         description: Forbidden  requires org_admin or project_manager role
 */
router.get("/users", orgUserListRoles, orgController.listUsers);

/**
 * @openapi
 * /org/users/{id}:
 *   get:
 *     summary: Get a user in the authenticated user's organization
 *     tags: [Organization]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 *       403:
 *         description: Forbidden  requires org_admin role
 *       404:
 *         description: Not found
 */
router.get(
  "/users/:id",
  orgAdminOnly,
  validate(orgUserIdParamSchema),
  orgController.getUser
);

/**
 * @openapi
 * /org/users/{id}/role:
 *   patch:
 *     summary: Change a user's role in the organization
 *     tags: [Organization]
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
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [org_admin, project_manager, team_member, client]
 *     responses:
 *       200:
 *         description: User role updated
 *       400:
 *         description: Cannot change own role
 *       403:
 *         description: Forbidden  requires org_admin role
 *       404:
 *         description: Not found
 */
router.patch(
  "/users/:id/role",
  orgAdminOnly,
  validate(updateUserRoleSchema),
  orgController.updateUserRole
);

/**
 * @openapi
 * /org/users/{id}:
 *   delete:
 *     summary: Remove a user from the organization
 *     tags: [Organization]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User removed
 *       400:
 *         description: Cannot remove self or last org admin
 *       403:
 *         description: Forbidden  requires org_admin role
 *       404:
 *         description: Not found
 */
router.delete(
  "/users/:id",
  orgAdminOnly,
  validate(orgUserIdParamSchema),
  orgController.removeUser
);

export default router;

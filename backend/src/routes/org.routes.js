import { Router } from "express";
import * as orgController from "../controllers/org.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { orgUserIdParamSchema, updateUserRoleSchema } from "../validators/org.validator.js";

const router = Router();

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
 */
router.get("/users", orgController.listUsers);

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
 *       404:
 *         description: Not found
 */
router.get(
  "/users/:id",
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
 *       404:
 *         description: Not found
 */
router.patch(
  "/users/:id/role",
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
 *       404:
 *         description: Not found
 */
router.delete(
  "/users/:id",
  validate(orgUserIdParamSchema),
  orgController.removeUser
);

export default router;

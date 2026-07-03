import { Router } from "express";
import * as inviteController from "../controllers/invite.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import {
  createInviteSchema,
  inviteIdParamSchema,
  inviteTokenParamSchema,
  acceptInviteSchema,
} from "../validators/invite.validator.js";

const router = Router();

/**
 * @openapi
 * /invites:
 *   get:
 *     summary: List pending invites for the authenticated user's organization
 *     tags: [Invites]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pending invites
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 invites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       email: { type: string, format: email }
 *                       role:
 *                         type: string
 *                         enum: [org_admin, project_manager, team_member, client]
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, expired]
 *                       expiresAt: { type: string, format: date-time }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Organization membership required
 */
router.get("/", authenticate, inviteController.listInvites);

/**
 * @openapi
 * /invites:
 *   post:
 *     summary: Invite a user to the authenticated user's organization
 *     tags: [Invites]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email: { type: string, format: email }
 *               role:
 *                 type: string
 *                 enum: [org_admin, project_manager, team_member, client]
 *     responses:
 *       201:
 *         description: Invite created and email sent
 *       409:
 *         description: User already in org or pending invite exists
 *       401:
 *         description: Authentication required
 *       503:
 *         description: Email not configured
 */
router.post(
  "/",
  authenticate,
  validate(createInviteSchema),
  inviteController.createInvite
);

/**
 * @openapi
 * /invites/{id}:
 *   delete:
 *     summary: Revoke a pending invite
 *     tags: [Invites]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite revoked
 *       404:
 *         description: Pending invite not found
 *       401:
 *         description: Authentication required
 */
router.delete(
  "/:id",
  authenticate,
  validate(inviteIdParamSchema),
  inviteController.revokeInvite
);

/**
 * @openapi
 * /invites/{token}:
 *   get:
 *     summary: Get invite details by token (public)
 *     tags: [Invites]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite details for the accept page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email: { type: string, format: email }
 *                 role:
 *                   type: string
 *                   enum: [org_admin, project_manager, team_member, client]
 *                 organizationName: { type: string }
 *       400:
 *         description: Invite expired or already used
 *       404:
 *         description: Invalid invite link
 */
router.get(
  "/:token",
  validate(inviteTokenParamSchema),
  inviteController.getInviteByToken
);

/**
 * @openapi
 * /invites/{token}/accept:
 *   post:
 *     summary: Accept an invite and create an account (public)
 *     tags: [Invites]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, password]
 *             properties:
 *               name: { type: string }
 *               password: { type: string, format: password }
 *               deviceId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Account created and session issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       400:
 *         description: Invite expired or already used
 *       404:
 *         description: Invalid invite link
 *       409:
 *         description: Email already registered
 */
router.post(
  "/:token/accept",
  authRateLimiter,
  validate(acceptInviteSchema),
  inviteController.acceptInvite
);

export default router;

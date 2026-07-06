import { Router } from "express";
import * as orgSettingsController from "../controllers/orgSettings.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  updateGeneralSettingsSchema,
  updateSecuritySettingsSchema,
  updateInvitePolicySchema,
  deactivateOrgSchema,
  deleteOrgSchema,
} from "../validators/orgSettings.validator.js";

const router = Router();

/**
 * @openapi
 * /org/settings:
 *   get:
 *     summary: Get organization settings
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Organization settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     isActive: { type: boolean }
 *                     branding:
 *                       type: object
 *                       properties:
 *                         logoUrl: { type: string, nullable: true }
 *                         primaryColor: { type: string }
 *                     timezone: { type: string }
 *                     security:
 *                       type: object
 *                       properties:
 *                         passwordMinLength: { type: integer }
 *                         require2FA: { type: boolean }
 *                     invitePolicy:
 *                       type: object
 *                       properties:
 *                         defaultRole:
 *                           type: string
 *                           enum: [project_manager, team_member, client]
 *                         inviteExpiryDays: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Org Admin only
 */
router.get("/", orgSettingsController.getSettings);

/**
 * @openapi
 * /org/settings/general:
 *   patch:
 *     summary: Update general organization settings
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, branding, timezone]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               branding:
 *                 type: object
 *                 properties:
 *                   logoUrl: { type: string, nullable: true }
 *                   primaryColor: { type: string }
 *               timezone: { type: string }
 *     responses:
 *       200:
 *         description: Settings updated
 *       409:
 *         description: Slug already in use
 */
router.patch(
  "/general",
  validate(updateGeneralSettingsSchema),
  orgSettingsController.updateGeneralSettings
);

/**
 * @openapi
 * /org/settings/security:
 *   patch:
 *     summary: Update organization security settings
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [security]
 *             properties:
 *               security:
 *                 type: object
 *                 required: [passwordMinLength, require2FA]
 *                 properties:
 *                   passwordMinLength: { type: integer, minimum: 6, maximum: 32 }
 *                   require2FA: { type: boolean }
 *     responses:
 *       200:
 *         description: Security settings updated
 */
router.patch(
  "/security",
  validate(updateSecuritySettingsSchema),
  orgSettingsController.updateSecuritySettings
);

/**
 * @openapi
 * /org/settings/invite-policy:
 *   patch:
 *     summary: Update organization invite policy settings
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [invitePolicy]
 *             properties:
 *               invitePolicy:
 *                 type: object
 *                 required: [defaultRole, inviteExpiryDays]
 *                 properties:
 *                   defaultRole:
 *                     type: string
 *                     enum: [project_manager, team_member, client]
 *                   inviteExpiryDays: { type: integer, minimum: 1, maximum: 30 }
 *     responses:
 *       200:
 *         description: Invite policy updated
 */
router.patch(
  "/invite-policy",
  validate(updateInvitePolicySchema),
  orgSettingsController.updateInvitePolicy
);

/**
 * @openapi
 * /org/settings/deactivate:
 *   patch:
 *     summary: Deactivate the organization
 *     description: Disables login for all org members. Does not delete data. Requires exact slug confirmation.
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmSlug]
 *             properties:
 *               confirmSlug: { type: string }
 *     responses:
 *       200:
 *         description: Organization deactivated
 *       400:
 *         description: Confirmation slug does not match
 */
router.patch(
  "/deactivate",
  validate(deactivateOrgSchema),
  orgSettingsController.deactivateOrg
);

/**
 * @openapi
 * /org/settings/delete:
 *   delete:
 *     summary: Permanently delete the organization
 *     description: Deletes the organization and all associated data. This cannot be undone. Requires exact slug confirmation.
 *     tags: [Organization Settings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmSlug]
 *             properties:
 *               confirmSlug: { type: string }
 *     responses:
 *       200:
 *         description: Organization deleted
 *       400:
 *         description: Confirmation slug does not match
 */
router.delete(
  "/delete",
  validate(deleteOrgSchema),
  orgSettingsController.deleteOrg
);

export default router;

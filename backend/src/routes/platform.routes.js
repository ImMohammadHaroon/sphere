import { Router } from "express";
import * as platformController from "../controllers/platform.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  deleteOrganizationSchema,
  listAllUsersQuerySchema,
  listOrganizationsQuerySchema,
  listPendingOrganizationsQuerySchema,
  listPlatformAuditLogsQuerySchema,
  organizationIdParamSchema,
  rejectOrganizationSchema,
  updateGeneralSettingsSchema,
  updateRegistrationSettingsSchema,
  updateSecuritySettingsSchema,
  updateMaintenanceSettingsSchema,
} from "../validators/platform.validator.js";

const router = Router();

/**
 * @openapi
 * /platform/reports/overview:
 *   get:
 *     summary: Platform-wide overview metrics (Super Admin)
 *     description: Returns aggregated organization, user, project, and task statistics for the platform dashboard.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Platform overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrganizations:
 *                   type: integer
 *                   example: 12
 *                 activeOrganizations:
 *                   type: integer
 *                   example: 10
 *                 totalUsers:
 *                   type: integer
 *                   example: 48
 *                 totalProjects:
 *                   type: integer
 *                   example: 34
 *                 activeProjects:
 *                   type: integer
 *                   example: 28
 *                 totalTasks:
 *                   type: integer
 *                   example: 156
 *                 tasksByStatus:
 *                   type: object
 *                   properties:
 *                     todo:
 *                       type: integer
 *                       example: 40
 *                     in-progress:
 *                       type: integer
 *                       example: 35
 *                     review:
 *                       type: integer
 *                       example: 21
 *                     done:
 *                       type: integer
 *                       example: 60
 *                 newOrganizationsLast30Days:
 *                   type: integer
 *                   example: 3
 *                 recentOrganizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       name:
 *                         type: string
 *                         example: Acme Corp
 *                       plan:
 *                         type: string
 *                         enum: [free, pro, enterprise]
 *                         example: pro
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       userCount:
 *                         type: integer
 *                         example: 8
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get("/reports/overview", platformController.getPlatformOverview);

/**
 * @openapi
 * /platform/organizations:
 *   get:
 *     summary: List organizations (Super Admin)
 *     description: Paginated list of non-deleted organizations with user and project counts. Supports search and filters.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search by organization name
 *       - in: query
 *         name: plan
 *         schema:
 *           type: string
 *           enum: [free, pro, enterprise]
 *         description: Filter by subscription plan
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active/suspended status
 *     responses:
 *       200:
 *         description: Paginated organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       name:
 *                         type: string
 *                         example: Acme Corp
 *                       slug:
 *                         type: string
 *                         example: acme-corp
 *                       plan:
 *                         type: string
 *                         enum: [free, pro, enterprise]
 *                         example: pro
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       userCount:
 *                         type: integer
 *                         example: 8
 *                       projectCount:
 *                         type: integer
 *                         example: 5
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *             example:
 *               organizations:
 *                 - id: 507f1f77bcf86cd799439011
 *                   name: Acme Corp
 *                   slug: acme-corp
 *                   plan: pro
 *                   isActive: true
 *                   userCount: 8
 *                   projectCount: 5
 *                   createdAt: 2026-06-15T10:00:00.000Z
 *               total: 1
 *               page: 1
 *               totalPages: 1
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/organizations",
  validate(listOrganizationsQuerySchema),
  platformController.listOrganizations
);

/**
 * @openapi
 * /platform/organizations/pending:
 *   get:
 *     summary: List organizations pending approval (Super Admin)
 *     description: Paginated list of self-registered organizations awaiting Super Admin approval, sorted oldest first.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Paginated pending organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       name:
 *                         type: string
 *                         example: Acme Corp
 *                       plan:
 *                         type: string
 *                         enum: [free, pro, enterprise]
 *                         example: free
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       admin:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Jane Admin
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: jane@acme.com
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/organizations/pending",
  validate(listPendingOrganizationsQuerySchema),
  platformController.listPendingOrganizations
);

/**
 * @openapi
 * /platform/organizations/{id}/approve:
 *   patch:
 *     summary: Approve a pending organization (Super Admin)
 *     description: Sets verificationStatus to approved and emails the org admin.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Organization approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization approved
 *                 organization:
 *                   type: object
 *       400:
 *         description: Organization is not pending approval
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 *       404:
 *         description: Organization not found
 */
router.patch(
  "/organizations/:id/approve",
  validate(organizationIdParamSchema),
  platformController.approveOrganization
);

/**
 * @openapi
 * /platform/organizations/{id}/reject:
 *   patch:
 *     summary: Reject a pending organization (Super Admin)
 *     description: Sets verificationStatus to rejected, optionally records a reason, and emails the org admin.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 example: Duplicate registration
 *     responses:
 *       200:
 *         description: Organization rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization rejected
 *                 organization:
 *                   type: object
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 *       404:
 *         description: Organization not found
 */
router.patch(
  "/organizations/:id/reject",
  validate(rejectOrganizationSchema),
  platformController.rejectOrganization
);

/**
 * @openapi
 * /platform/organizations/{id}:
 *   get:
 *     summary: Get organization detail (Super Admin)
 *     description: Returns organization profile, members, projects, and aggregate stats. Deleted organizations return 404.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Organization detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     plan:
 *                       type: string
 *                       enum: [free, pro, enterprise]
 *                     isActive:
 *                       type: boolean
 *                     timezone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 members:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [active, archived]
 *                       taskCount:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 stats:
 *                   type: object
 *                   properties:
 *                     userCount:
 *                       type: integer
 *                     projectCount:
 *                       type: integer
 *                     taskCount:
 *                       type: integer
 *             example:
 *               organization:
 *                 id: 507f1f77bcf86cd799439011
 *                 name: Acme Corp
 *                 slug: acme-corp
 *                 plan: pro
 *                 isActive: true
 *                 timezone: UTC
 *                 createdAt: 2026-06-15T10:00:00.000Z
 *               members:
 *                 - id: 507f1f77bcf86cd799439012
 *                   name: Jane Admin
 *                   email: jane@acme.com
 *                   role: org_admin
 *                   createdAt: 2026-06-15T10:05:00.000Z
 *               projects:
 *                 - id: 507f1f77bcf86cd799439013
 *                   name: Website Redesign
 *                   status: active
 *                   taskCount: 12
 *                   createdAt: 2026-06-16T09:00:00.000Z
 *               stats:
 *                 userCount: 8
 *                 projectCount: 5
 *                 taskCount: 42
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/organizations/:id",
  validate(organizationIdParamSchema),
  platformController.getOrganizationDetail
);

/**
 * @openapi
 * /platform/organizations/{id}/suspend:
 *   patch:
 *     summary: Suspend organization (Super Admin)
 *     description: Sets isActive to false. Deleted organizations return 404.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Organization suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization suspended
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     plan:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *                     timezone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/organizations/:id/suspend",
  validate(organizationIdParamSchema),
  platformController.suspendOrganization
);

/**
 * @openapi
 * /platform/organizations/{id}/activate:
 *   patch:
 *     summary: Activate organization (Super Admin)
 *     description: Sets isActive to true. Deleted organizations return 404.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Organization activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization activated
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     plan:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     timezone:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/organizations/:id/activate",
  validate(organizationIdParamSchema),
  platformController.activateOrganization
);

/**
 * @openapi
 * /platform/organizations/{id}:
 *   delete:
 *     summary: Soft-delete organization (Super Admin)
 *     description: Sets isActive to false and records deletedAt. Requires confirmSlug matching the organization slug. Deleted organizations are hidden from list and return 404 on subsequent access.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [confirmSlug]
 *             properties:
 *               confirmSlug:
 *                 type: string
 *                 example: acme-corp
 *     responses:
 *       200:
 *         description: Organization deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization deleted
 *                 organization:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Confirmation slug does not match
 *       404:
 *         description: Organization not found
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.delete(
  "/organizations/:id",
  validate(deleteOrganizationSchema),
  platformController.deleteOrganization
);

/**
 * @openapi
 * /platform/users:
 *   get:
 *     summary: List all platform users (Super Admin)
 *     description: Paginated cross-organization user search. Read-only oversight — no user mutations from this endpoint. Users in soft-deleted organizations are excluded unless filtering by a specific active organization.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [super_admin, org_admin, project_manager, team_member, client]
 *         description: Filter by user role
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization id
 *     responses:
 *       200:
 *         description: Paginated users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439012
 *                       name:
 *                         type: string
 *                         example: Jane Admin
 *                       email:
 *                         type: string
 *                         example: jane@acme.com
 *                       role:
 *                         type: string
 *                         enum: [super_admin, org_admin, project_manager, team_member, client]
 *                         example: org_admin
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       organization:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           slug:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 total:
 *                   type: integer
 *                   example: 48
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 3
 *             example:
 *               users:
 *                 - id: 507f1f77bcf86cd799439012
 *                   name: Jane Admin
 *                   email: jane@acme.com
 *                   role: org_admin
 *                   isActive: true
 *                   organization:
 *                     id: 507f1f77bcf86cd799439011
 *                     name: Acme Corp
 *                     slug: acme-corp
 *                   createdAt: 2026-06-15T10:05:00.000Z
 *                 - id: 507f1f77bcf86cd799439099
 *                   name: Platform Super Admin
 *                   email: admin@sphere.com
 *                   role: super_admin
 *                   isActive: true
 *                   organization: null
 *                   createdAt: 2026-06-01T08:00:00.000Z
 *               total: 2
 *               page: 1
 *               totalPages: 1
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/users",
  validate(listAllUsersQuerySchema),
  platformController.listAllUsers
);

/**
 * @openapi
 * /platform/audit-logs:
 *   get:
 *     summary: List platform-wide audit logs (Super Admin)
 *     description: Paginated audit trail across all organizations. Not scoped to a single tenant. Platform-level actions may have a null organization.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (e.g. organization.suspended, rbac.access_denied)
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization id
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include logs on or after this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Include logs on or before this date
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       action:
 *                         type: string
 *                         example: organization.suspended
 *                       targetType:
 *                         type: string
 *                         nullable: true
 *                         example: Organization
 *                       targetId:
 *                         type: string
 *                         nullable: true
 *                         example: 507f1f77bcf86cd799439012
 *                       metadata:
 *                         type: object
 *                       ip:
 *                         type: string
 *                         nullable: true
 *                         example: 192.168.1.1
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       actor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Jane Admin
 *                           email:
 *                             type: string
 *                             example: jane@acme.com
 *                       organization:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: 507f1f77bcf86cd799439012
 *                           name:
 *                             type: string
 *                             example: Acme Corp
 *                           slug:
 *                             type: string
 *                             example: acme-corp
 *                 total:
 *                   type: integer
 *                   example: 128
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 7
 *             example:
 *               logs:
 *                 - id: 507f1f77bcf86cd799439011
 *                   action: organization.suspended
 *                   targetType: Organization
 *                   targetId: 507f1f77bcf86cd799439012
 *                   metadata:
 *                     slug: acme-corp
 *                     name: Acme Corp
 *                   ip: 192.168.1.1
 *                   createdAt: 2026-06-15T10:00:00.000Z
 *                   actor:
 *                     name: Platform Super Admin
 *                     email: admin@sphere.com
 *                   organization:
 *                     id: 507f1f77bcf86cd799439012
 *                     name: Acme Corp
 *                     slug: acme-corp
 *                 - id: 507f1f77bcf86cd799439099
 *                   action: auth.login
 *                   targetType: User
 *                   targetId: 507f1f77bcf86cd799439098
 *                   metadata: {}
 *                   ip: 10.0.0.1
 *                   createdAt: 2026-06-01T08:00:00.000Z
 *                   actor:
 *                     name: Platform Super Admin
 *                     email: admin@sphere.com
 *                   organization: null
 *               total: 2
 *               page: 1
 *               totalPages: 1
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/audit-logs",
  validate(listPlatformAuditLogsQuerySchema),
  platformController.listPlatformAuditLogs
);

/**
 * @openapi
 * /platform/settings:
 *   get:
 *     summary: Get platform settings (Super Admin)
 *     description: Returns the singleton platform-wide configuration document. Creates defaults on first access.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Platform settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 000000000000000000000001
 *                     general:
 *                       type: object
 *                       properties:
 *                         platformName:
 *                           type: string
 *                           example: ProjectSphere
 *                         supportEmail:
 *                           type: string
 *                           example: support@sphere.com
 *                     registration:
 *                       type: object
 *                       properties:
 *                         allowSelfServeSignup:
 *                           type: boolean
 *                           example: true
 *                         defaultPlan:
 *                           type: string
 *                           enum: [free, pro, enterprise]
 *                           example: free
 *                     security:
 *                       type: object
 *                       properties:
 *                         globalPasswordMinLength:
 *                           type: integer
 *                           example: 8
 *                         enforceGlobal2FA:
 *                           type: boolean
 *                           example: false
 *                     maintenance:
 *                       type: object
 *                       properties:
 *                         enabled:
 *                           type: boolean
 *                           example: false
 *                         message:
 *                           type: string
 *                           example: ""
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get("/settings", platformController.getPlatformSettings);

/**
 * @openapi
 * /platform/settings/general:
 *   patch:
 *     summary: Update platform general settings (Super Admin)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [general]
 *             properties:
 *               general:
 *                 type: object
 *                 required: [platformName, supportEmail]
 *                 properties:
 *                   platformName:
 *                     type: string
 *                     example: ProjectSphere
 *                   supportEmail:
 *                     type: string
 *                     example: support@sphere.com
 *     responses:
 *       200:
 *         description: General settings updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/settings/general",
  validate(updateGeneralSettingsSchema),
  platformController.updateGeneralSettings
);

/**
 * @openapi
 * /platform/settings/registration:
 *   patch:
 *     summary: Update platform registration settings (Super Admin)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registration]
 *             properties:
 *               registration:
 *                 type: object
 *                 required: [allowSelfServeSignup, defaultPlan]
 *                 properties:
 *                   allowSelfServeSignup:
 *                     type: boolean
 *                     example: true
 *                   defaultPlan:
 *                     type: string
 *                     enum: [free, pro, enterprise]
 *                     example: free
 *     responses:
 *       200:
 *         description: Registration settings updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/settings/registration",
  validate(updateRegistrationSettingsSchema),
  platformController.updateRegistrationSettings
);

/**
 * @openapi
 * /platform/settings/security:
 *   patch:
 *     summary: Update platform security settings (Super Admin)
 *     description: Stored preferences only — globalPasswordMinLength and enforceGlobal2FA are not enforced yet.
 *     tags: [Platform]
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
 *                 required: [globalPasswordMinLength, enforceGlobal2FA]
 *                 properties:
 *                   globalPasswordMinLength:
 *                     type: integer
 *                     minimum: 6
 *                     maximum: 32
 *                     example: 8
 *                   enforceGlobal2FA:
 *                     type: boolean
 *                     example: false
 *     responses:
 *       200:
 *         description: Security settings updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/settings/security",
  validate(updateSecuritySettingsSchema),
  platformController.updateSecuritySettings
);

/**
 * @openapi
 * /platform/settings/maintenance:
 *   patch:
 *     summary: Update platform maintenance settings (Super Admin)
 *     description: When enabled, blocks login for all roles except super_admin.
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [maintenance]
 *             properties:
 *               maintenance:
 *                 type: object
 *                 required: [enabled, message]
 *                 properties:
 *                   enabled:
 *                     type: boolean
 *                     example: false
 *                   message:
 *                     type: string
 *                     example: Scheduled maintenance in progress. Please try again later.
 *     responses:
 *       200:
 *         description: Maintenance settings updated
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.patch(
  "/settings/maintenance",
  validate(updateMaintenanceSettingsSchema),
  platformController.updateMaintenanceSettings
);

export default router;

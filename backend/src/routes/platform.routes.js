import { Router } from "express";
import * as platformController from "../controllers/platform.controller.js";

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
 *             example:
 *               totalOrganizations: 12
 *               activeOrganizations: 10
 *               totalUsers: 48
 *               totalProjects: 34
 *               activeProjects: 28
 *               totalTasks: 156
 *               tasksByStatus:
 *                 todo: 40
 *                 in-progress: 35
 *                 review: 21
 *                 done: 60
 *               newOrganizationsLast30Days: 3
 *               recentOrganizations:
 *                 - _id: 507f1f77bcf86cd799439011
 *                   name: Acme Corp
 *                   plan: pro
 *                   isActive: true
 *                   createdAt: 2026-06-15T10:00:00.000Z
 *                   userCount: 8
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Authentication required
 *       403:
 *         description: Super Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forbidden
 */
router.get("/reports/overview", platformController.getPlatformOverview);

/**
 * @openapi
 * /platform/organizations:
 *   get:
 *     summary: List all organizations (Super Admin)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All platform organizations
 */
router.get("/organizations", platformController.listOrganizations);

/**
 * @openapi
 * /platform/organizations/{id}:
 *   get:
 *     summary: Get organization by id (Super Admin)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Organization details
 *       404:
 *         description: Not found
 */
router.get("/organizations/:id", platformController.getOrganization);

export default router;

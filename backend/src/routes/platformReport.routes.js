import { Router } from "express";
import * as platformReportController from "../controllers/platformReport.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  listPlatformProjectsQuerySchema,
  platformProjectReportParamSchema,
} from "../validators/platformReport.validator.js";

const router = Router();

/**
 * @openapi
 * /platform/projects:
 *   get:
 *     summary: List projects across all organizations (Super Admin)
 *     tags: [Platform]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive project name search
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization id
 *     responses:
 *       200:
 *         description: Paginated cross-organization project list
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Super Admin role required
 */
router.get(
  "/projects",
  validate(listPlatformProjectsQuerySchema),
  platformReportController.listPlatformProjects
);

/**
 * @openapi
 * /platform/projects/{id}/reports/burndown:
 *   get:
 *     summary: Burndown chart series for any project (Super Admin)
 *     tags: [Platform, Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ideal vs actual remaining tasks by day
 *       403:
 *         description: Super Admin role required
 *       404:
 *         description: Project not found
 */
router.get(
  "/projects/:id/reports/burndown",
  validate(platformProjectReportParamSchema),
  platformReportController.getProjectBurndown
);

/**
 * @openapi
 * /platform/projects/{id}/reports/velocity:
 *   get:
 *     summary: Task completion velocity for the last 8 weeks (Super Admin)
 *     tags: [Platform, Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Weekly completed-task counts
 *       403:
 *         description: Super Admin role required
 *       404:
 *         description: Project not found
 */
router.get(
  "/projects/:id/reports/velocity",
  validate(platformProjectReportParamSchema),
  platformReportController.getProjectVelocity
);

/**
 * @openapi
 * /platform/projects/{id}/reports/workload:
 *   get:
 *     summary: Workload by assignee with per-column task counts (Super Admin)
 *     tags: [Platform, Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Assignee workload breakdown
 *       403:
 *         description: Super Admin role required
 *       404:
 *         description: Project not found
 */
router.get(
  "/projects/:id/reports/workload",
  validate(platformProjectReportParamSchema),
  platformReportController.getProjectWorkload
);

export default router;

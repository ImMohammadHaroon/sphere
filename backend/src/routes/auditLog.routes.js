import { Router } from "express";
import * as auditLogController from "../controllers/auditLog.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { listAuditLogsQuerySchema } from "../validators/auditLog.validator.js";

const router = Router();

/**
 * @openapi
 * /org/audit-logs:
 *   get:
 *     summary: List audit logs for the authenticated user's organization
 *     tags: [Audit]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action (e.g. project.created, rbac.access_denied)
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
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
 *                       id: { type: string }
 *                       action: { type: string }
 *                       targetType: { type: string, nullable: true }
 *                       targetId: { type: string, nullable: true }
 *                       metadata: { type: object }
 *                       ip: { type: string, nullable: true }
 *                       createdAt: { type: string, format: date-time }
 *                       actor:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           name: { type: string }
 *                           email: { type: string }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 totalPages: { type: integer }
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Org Admin only
 */
router.get(
  "/",
  validate(listAuditLogsQuerySchema),
  auditLogController.listOrgAuditLogs
);

export default router;

import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
import { requireOwnershipOrRole } from "../middleware/requireOwnershipOrRole.js";
import { loadTask } from "../middleware/rbac.loaders.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  listTasksParamSchema,
  taskIdParamSchema,
} from "../validators/task.validator.js";

const taskCreateRoles = requireRole([
  "org_admin",
  "project_manager",
  "team_member",
]);
const taskUpdateAccess = requireOwnershipOrRole(
  loadTask,
  ["org_admin", "project_manager"],
  "assigneeId"
);
const taskDeleteRoles = requireRole(["org_admin", "project_manager"]);

export const projectTaskRouter = Router({ mergeParams: true });

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     summary: List tasks for a project (tenant-scoped)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of tasks
 *       404:
 *         description: Project not found
 */
projectTaskRouter.get(
  "/",
  validate(listTasksParamSchema),
  taskController.listTasks
);

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   post:
 *     summary: Create a task under a project (tenant-scoped)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, review, done] }
 *               assigneeId: { type: string, nullable: true }
 *               priority: { type: string, enum: [low, medium, high] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               position: { type: number }
 *     responses:
 *       201:
 *         description: Task created
 *       403:
 *         description: Forbidden  client role cannot create tasks
 *       404:
 *         description: Project not found
 */
projectTaskRouter.post(
  "/",
  taskCreateRoles,
  validate(createTaskSchema),
  taskController.createTask
);

const taskRouter = Router();

/**
 * @openapi
 * /tasks/mine:
 *   get:
 *     summary: List tasks assigned to the authenticated user across all projects
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of tasks assigned to the current user
 */
taskRouter.get("/mine", taskController.listMyTasks);

/**
 * @openapi
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by id (tenant-scoped)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Not found
 */
taskRouter.get("/:id", validate(taskIdParamSchema), taskController.getTask);

/**
 * @openapi
 * /tasks/{id}/move:
 *   patch:
 *     summary: Move or reorder a task on the Kanban board (tenant-scoped)
 *     tags: [Tasks]
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
 *             properties:
 *               status: { type: string, enum: [todo, in-progress, review, done] }
 *               position: { type: number }
 *     responses:
 *       200:
 *         description: Task moved
 *       403:
 *         description: Forbidden  team members may only move tasks assigned to them
 *       404:
 *         description: Not found
 */
taskRouter.patch(
  "/:id/move",
  validate(moveTaskSchema),
  taskUpdateAccess,
  taskController.moveTask
);

/**
 * @openapi
 * /tasks/{id}:
 *   patch:
 *     summary: Update a task (tenant-scoped)
 *     tags: [Tasks]
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
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in-progress, review, done] }
 *               assigneeId: { type: string, nullable: true }
 *               priority: { type: string, enum: [low, medium, high] }
 *               dueDate: { type: string, format: date-time, nullable: true }
 *               position: { type: number }
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Forbidden  team members may only update status on tasks assigned to them
 *       404:
 *         description: Not found
 */
taskRouter.patch(
  "/:id",
  validate(updateTaskSchema),
  taskUpdateAccess,
  taskController.updateTask
);

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (tenant-scoped)
 *     tags: [Tasks]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Forbidden  team members cannot delete tasks
 *       404:
 *         description: Not found
 */
taskRouter.delete(
  "/:id",
  validate(taskIdParamSchema),
  taskDeleteRoles,
  taskController.deleteTask
);

export default taskRouter;

import { Router } from "express";
import * as taskController from "../controllers/task.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksParamSchema,
  taskIdParamSchema,
} from "../validators/task.validator.js";

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
 *       404:
 *         description: Project not found
 */
projectTaskRouter.post(
  "/",
  validate(createTaskSchema),
  taskController.createTask
);

const taskRouter = Router();

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
 *       404:
 *         description: Not found
 */
taskRouter.patch("/:id", validate(updateTaskSchema), taskController.updateTask);

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
 *       404:
 *         description: Not found
 */
taskRouter.delete("/:id", validate(taskIdParamSchema), taskController.deleteTask);

export default taskRouter;

import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";
import { createNotification } from "../services/notification.service.js";
import { emitToProject } from "../sockets/index.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function getColumnKeys(project) {
  return (project.columns ?? []).map((c) => c.key);
}

function assertValidTaskStatus(project, status) {
  if (!getColumnKeys(project).includes(status)) {
    throw badRequest("Invalid status for this project's board");
  }
}

function getDefaultStatus(project) {
  const sorted = [...(project.columns ?? [])].sort((a, b) => a.order - b.order);
  return sorted[0]?.key ?? "todo";
}

function isDoneColumn(project, statusKey) {
  return project.columns?.find((c) => c.key === statusKey)?.isDone === true;
}

function formatAssignee(assignee) {
  if (!assignee) {
    return null;
  }

  if (typeof assignee === "object" && assignee.name !== undefined) {
    return {
      id: assignee._id.toString(),
      name: assignee.name,
      email: assignee.email,
    };
  }

  return {
    id: assignee.toString(),
  };
}

function formatTask(task) {
  const assignee = formatAssignee(task.assigneeId);

  return {
    ...task,
    _id: task._id.toString(),
    organizationId: task.organizationId?.toString(),
    projectId:
      task.projectId && typeof task.projectId === "object" && task.projectId._id
        ? {
            id: task.projectId._id.toString(),
            name: task.projectId.name,
            columns: task.projectId.columns ?? [],
          }
        : task.projectId?.toString?.() ?? task.projectId,
    assigneeId: assignee?.id ?? null,
    assignee,
  };
}

async function loadTaskWithAssignee(req, filter) {
  return req
    .scopedFindOne(Task, filter)
    .populate("assigneeId", "name email")
    .lean();
}

async function assertProjectInOrg(req, projectId) {
  const project = await req.scopedFindOne(Project, { _id: projectId }).lean();
  if (!project) {
    throw notFound();
  }
  return project;
}

export async function listTasks(req, res, next) {
  try {
    await assertProjectInOrg(req, req.params.projectId);

    const tasks = await req
      .scopedQuery(Task, { projectId: req.params.projectId })
      .populate("assigneeId", "name email")
      .sort({ position: 1, createdAt: 1 })
      .lean();

    res.json({ tasks: tasks.map(formatTask) });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    const project = await assertProjectInOrg(req, req.params.projectId);
    const status = req.body.status ?? getDefaultStatus(project);
    assertValidTaskStatus(project, status);

    const created = await Task.create({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      title: req.body.title,
      description: req.body.description ?? "",
      status,
      assigneeId: req.body.assigneeId ?? null,
      priority: req.body.priority ?? "medium",
      dueDate: req.body.dueDate ?? null,
      position: req.body.position ?? 0,
    });

    const task = await loadTaskWithAssignee(req, { _id: created._id });

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "task.created",
      targetType: "Task",
      targetId: created._id,
      metadata: { title: created.title, projectId: req.params.projectId },
      ip: getClientIp(req),
    });

    emitToProject(req.params.projectId, "task:created", formatTask(task));

    const assigneeId = req.body.assigneeId;
    if (assigneeId && assigneeId !== req.user.userId) {
      try {
        await createNotification({
          organizationId: created.organizationId,
          userId: assigneeId,
          type: "task_assigned",
          payload: {
            taskId: created._id.toString(),
            taskTitle: created.title,
            projectId: created.projectId.toString(),
          },
        });
      } catch (notifyErr) {
        console.error("Failed to create task_assigned notification:", notifyErr);
      }
    }

    res.status(201).json({ task: formatTask(task) });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await loadTaskWithAssignee(req, { _id: req.params.id });

    if (!task) {
      throw notFound();
    }

    res.json({ task: formatTask(task) });
  } catch (err) {
    next(err);
  }
}

const TEAM_MEMBER_TASK_FIELDS = new Set(["status"]);

export async function updateTask(req, res, next) {
  try {
    const existing = await req
      .scopedFindOne(Task, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
    }

    if (req.user.role === "team_member") {
      const forbiddenFields = Object.keys(req.body).filter(
        (field) =>
          req.body[field] !== undefined && !TEAM_MEMBER_TASK_FIELDS.has(field)
      );

      if (forbiddenFields.length > 0) {
        const err = new Error(
          "Forbidden: team members may only update task status"
        );
        err.status = 403;
        throw err;
      }
    }

    const updates = {};
    for (const field of [
      "title",
      "description",
      "status",
      "assigneeId",
      "priority",
      "dueDate",
      "position",
    ]) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.status !== undefined) {
      const project = await req
        .scopedFindOne(Project, { _id: existing.projectId })
        .lean();

      if (!project) {
        throw notFound("Project not found");
      }

      assertValidTaskStatus(project, updates.status);
    }

    await req.scopedFindOneAndUpdate(Task, { _id: req.params.id }, updates);

    const task = await loadTaskWithAssignee(req, { _id: req.params.id });

    const metadata = { changes: updates };
    if (
      updates.status !== undefined &&
      updates.status !== existing.status
    ) {
      metadata.from = existing.status;
      metadata.to = updates.status;
    }

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "task.updated",
      targetType: "Task",
      targetId: task._id,
      metadata,
      ip: getClientIp(req),
    });

    emitToProject(
      existing.projectId.toString(),
      "task:updated",
      formatTask(task)
    );

    if (
      updates.assigneeId !== undefined &&
      updates.assigneeId &&
      updates.assigneeId.toString() !== existing.assigneeId?.toString() &&
      updates.assigneeId.toString() !== req.user.userId
    ) {
      try {
        await createNotification({
          organizationId: task.organizationId,
          userId: updates.assigneeId,
          type: "task_assigned",
          payload: {
            taskId: task._id.toString(),
            taskTitle: task.title,
            projectId: task.projectId?.toString?.() ?? task.projectId,
          },
        });
      } catch (notifyErr) {
        console.error("Failed to create task_assigned notification:", notifyErr);
      }
    }

    res.json({ task: formatTask(task) });
  } catch (err) {
    next(err);
  }
}

async function resolveDestinationPosition(req, projectId, status, excludeId) {
  const last = await req
    .scopedQuery(Task, { projectId, status, _id: { $ne: excludeId } })
    .sort({ position: -1 })
    .limit(1)
    .lean();

  return last.length > 0 ? last[0].position + 1 : 0;
}

async function shiftSiblingPositions(
  req,
  { projectId, taskId, oldStatus, oldPosition, newStatus, newPosition }
) {
  const orgId = new mongoose.Types.ObjectId(req.user.organizationId);
  const exclude = { _id: { $ne: taskId } };
  const base = { organizationId: orgId, projectId, ...exclude };

  if (oldStatus !== newStatus) {
    await Task.updateMany(
      { ...base, status: oldStatus, position: { $gt: oldPosition } },
      { $inc: { position: -1 } }
    );
    await Task.updateMany(
      { ...base, status: newStatus, position: { $gte: newPosition } },
      { $inc: { position: 1 } }
    );
    return;
  }

  if (newPosition === oldPosition) {
    return;
  }

  if (newPosition > oldPosition) {
    await Task.updateMany(
      {
        ...base,
        status: oldStatus,
        position: { $gt: oldPosition, $lte: newPosition },
      },
      { $inc: { position: -1 } }
    );
    return;
  }

  await Task.updateMany(
    {
      ...base,
      status: oldStatus,
      position: { $gte: newPosition, $lt: oldPosition },
    },
    { $inc: { position: 1 } }
  );
}

export async function moveTask(req, res, next) {
  try {
    const task = await req.scopedFindOne(Task, { _id: req.params.id });

    if (!task) {
      throw notFound();
    }

    const project = await req
      .scopedFindOne(Project, { _id: task.projectId })
      .lean();

    if (!project) {
      throw notFound("Project not found");
    }

    const oldStatus = task.status;
    const oldPosition = task.position;
    const newStatus = req.body.status ?? oldStatus;
    let newPosition = req.body.position;

    if (req.body.status !== undefined) {
      assertValidTaskStatus(project, newStatus);
    }

    if (req.body.status !== undefined && req.body.position === undefined) {
      newPosition = await resolveDestinationPosition(
        req,
        task.projectId,
        newStatus,
        task._id
      );
    } else if (newPosition === undefined) {
      newPosition = oldPosition;
    }

    await shiftSiblingPositions(req, {
      projectId: task.projectId,
      taskId: task._id,
      oldStatus,
      oldPosition,
      newStatus,
      newPosition,
    });

    task.status = newStatus;
    task.position = newPosition;
    await task.save();

    const populated = await loadTaskWithAssignee(req, { _id: task._id });

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "task.moved",
      targetType: "Task",
      targetId: task._id,
      metadata: {
        fromStatus: oldStatus,
        toStatus: newStatus,
        position: newPosition,
      },
      ip: getClientIp(req),
    });

    emitToProject(task.projectId.toString(), "task:moved", {
      taskId: task._id.toString(),
      status: newStatus,
      position: newPosition,
    });

    const moverId = req.user.userId;
    const assigneeId = task.assigneeId?.toString?.() ?? null;
    if (
      isDoneColumn(project, newStatus) &&
      assigneeId &&
      moverId !== assigneeId
    ) {
      try {
        await createNotification({
          organizationId: task.organizationId,
          userId: project.ownerId,
          type: "task_moved",
          payload: {
            taskId: task._id.toString(),
            taskTitle: task.title,
            projectId: project._id.toString(),
            projectName: project.name,
            newStatus,
          },
        });
      } catch (notifyErr) {
        console.error("Failed to create task_moved notification:", notifyErr);
      }
    }

    res.json({ task: formatTask(populated) });
  } catch (err) {
    next(err);
  }
}

export async function listMyTasks(req, res, next) {
  try {
    const tasks = await req
      .scopedQuery(Task, { assigneeId: req.user.userId })
      .populate("projectId", "name columns")
      .populate("assigneeId", "name email")
      .sort({ dueDate: 1, updatedAt: -1 })
      .lean();

    res.json({ tasks: tasks.map(formatTask) });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await req
      .scopedFindOneAndDelete(Task, { _id: req.params.id })
      .lean();

    if (!task) {
      throw notFound();
    }

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "task.deleted",
      targetType: "Task",
      targetId: task._id,
      metadata: { title: task.title, projectId: task.projectId?.toString() },
      ip: getClientIp(req),
    });

    res.json({ message: "Task deleted", task: formatTask(task) });
  } catch (err) {
    next(err);
  }
}


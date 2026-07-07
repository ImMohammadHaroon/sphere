import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
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
    await assertProjectInOrg(req, req.params.projectId);

    const created = await Task.create({
      organizationId: req.user.organizationId,
      projectId: req.params.projectId,
      title: req.body.title,
      description: req.body.description ?? "",
      status: req.body.status ?? "todo",
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

export async function updateTask(req, res, next) {
  try {
    const existing = await req
      .scopedFindOne(Task, { _id: req.params.id })
      .lean();

    if (!existing) {
      throw notFound();
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

    res.json({ task: formatTask(task) });
  } catch (err) {
    next(err);
  }
}

export async function listMyTasks(req, res, next) {
  try {
    const tasks = await req
      .scopedQuery(Task, { assigneeId: req.user.userId })
      .populate("projectId", "name")
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

import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
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
      .sort({ position: 1, createdAt: 1 })
      .lean();

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req, res, next) {
  try {
    await assertProjectInOrg(req, req.params.projectId);

    const task = await Task.create({
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

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await req.scopedFindOne(Task, { _id: req.params.id }).lean();

    if (!task) {
      throw notFound();
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req, res, next) {
  try {
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

    const task = await req
      .scopedFindOneAndUpdate(Task, { _id: req.params.id }, updates)
      .lean();

    if (!task) {
      throw notFound();
    }

    res.json({ task });
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

    res.json({ message: "Task deleted", task });
  } catch (err) {
    next(err);
  }
}

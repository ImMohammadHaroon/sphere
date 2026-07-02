import { Project } from "../models/Project.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

export async function listProjects(req, res, next) {
  try {
    const projects = await req
      .scopedQuery(Project)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req, res, next) {
  try {
    const project = await Project.create({
      organizationId: req.user.organizationId,
      ownerId: req.user.userId,
      members: [req.user.userId],
      name: req.body.name,
      description: req.body.description ?? "",
      startDate: req.body.startDate ?? null,
      dueDate: req.body.dueDate ?? null,
    });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req, res, next) {
  try {
    const project = await req.scopedFindOne(Project, { _id: req.params.id }).lean();

    if (!project) {
      throw notFound();
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req, res, next) {
  try {
    const updates = {};
    for (const field of ["name", "description", "status", "dueDate"]) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const project = await req.scopedFindOneAndUpdate(
      Project,
      { _id: req.params.id },
      updates
    ).lean();

    if (!project) {
      throw notFound();
    }

    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function archiveProject(req, res, next) {
  try {
    const project = await req.scopedFindOneAndUpdate(
      Project,
      { _id: req.params.id },
      { status: "archived" }
    ).lean();

    if (!project) {
      throw notFound();
    }

    res.json({ project, message: "Project archived" });
  } catch (err) {
    next(err);
  }
}

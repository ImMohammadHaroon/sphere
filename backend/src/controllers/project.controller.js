import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { KanbanTemplate } from "../models/KanbanTemplate.js";
import { User } from "../models/User.js";
import {
  createKanbanTemplate,
  copyColumns,
  DEFAULT_BOARD_COLUMNS,
} from "../services/kanbanTemplate.service.js";
import { isProjectMember } from "../utils/projectAccess.js";

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

function membershipFilter(userId) {
  return {
    $or: [{ ownerId: userId }, { members: userId }],
  };
}

function formatMember(member) {
  return {
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    role: member.role,
  };
}

function formatProject(project) {
  const formatted = {
    ...project,
    _id: project._id.toString(),
    organizationId: project.organizationId?.toString(),
    ownerId: project.ownerId?.toString?.() ?? project.ownerId,
  };

  if (Array.isArray(project.members) && project.members.length > 0) {
    const first = project.members[0];
    if (first && typeof first === "object" && first.name !== undefined) {
      formatted.members = project.members.map(formatMember);
    } else {
      formatted.members = project.members.map((id) => id.toString());
    }
  }

  return formatted;
}

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", "name email role")
    .lean();
}

export async function listProjects(req, res, next) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const filter =
      req.user.role === "org_admin" ? {} : membershipFilter(userId);

    const projects = await req
      .scopedQuery(Project, filter)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

async function resolveProjectColumns(req) {
  if (req.body.kanbanTemplateId) {
    const template = await req
      .scopedFindOne(KanbanTemplate, { _id: req.body.kanbanTemplateId })
      .lean();

    if (!template) {
      throw notFound("Kanban template not found");
    }

    return {
      kanbanTemplateId: template._id,
      columns: copyColumns(template.columns),
    };
  }

  if (req.body.newTemplate) {
    const template = await createKanbanTemplate({
      organizationId: req.user.organizationId,
      createdBy: req.user.userId,
      name: req.body.newTemplate.name,
      columns: req.body.newTemplate.columns,
    });

    return {
      kanbanTemplateId: template._id,
      columns: copyColumns(template.columns),
    };
  }

  return {
    kanbanTemplateId: null,
    columns: copyColumns(DEFAULT_BOARD_COLUMNS),
  };
}

export async function createProject(req, res, next) {
  try {
    const { kanbanTemplateId, columns } = await resolveProjectColumns(req);

    const project = await Project.create({
      organizationId: req.user.organizationId,
      ownerId: req.user.userId,
      members: [req.user.userId],
      name: req.body.name,
      description: req.body.description ?? "",
      startDate: req.body.startDate ?? null,
      dueDate: req.body.dueDate ?? null,
      kanbanTemplateId,
      columns,
    });

    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

async function assertProjectReadable(req, projectId) {
  const project = await loadProjectWithMembers(req, projectId);

  if (!project) {
    throw notFound();
  }

  if (
    req.user.role !== "org_admin" &&
    !isProjectMember(project, req.user.userId)
  ) {
    throw notFound();
  }

  return project;
}

async function buildAssignableMembers(req, project) {
  const memberMap = new Map();

  for (const member of project.members ?? []) {
    if (member && typeof member === "object" && member._id) {
      memberMap.set(member._id.toString(), formatMember(member));
    }
  }

  const ownerId = project.ownerId?.toString?.() ?? project.ownerId;
  if (ownerId && !memberMap.has(ownerId)) {
    const owner = await req.scopedFindOne(User, { _id: ownerId }).lean();
    if (owner) {
      memberMap.set(ownerId, formatMember(owner));
    }
  }

  return Array.from(memberMap.values());
}

export async function getProject(req, res, next) {
  try {
    const project = await assertProjectReadable(req, req.params.id);
    res.json({ project: formatProject(project) });
  } catch (err) {
    next(err);
  }
}

export async function listProjectMembers(req, res, next) {
  try {
    const project = await assertProjectReadable(req, req.params.id);
    const members = await buildAssignableMembers(req, project);
    res.json({ members });
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

export async function addProjectMember(req, res, next) {
  try {
    const project = await req
      .scopedFindOne(Project, { _id: req.params.id })
      .lean();

    if (!project) {
      throw notFound();
    }

    const user = await req
      .scopedFindOne(User, { _id: req.body.userId })
      .lean();

    if (!user) {
      throw notFound("User not found in organization");
    }

    await req.scopedFindOneAndUpdate(
      Project,
      { _id: req.params.id },
      { $addToSet: { members: req.body.userId } }
    );

    const updated = await loadProjectWithMembers(req, req.params.id);

    res.json({ project: formatProject(updated) });
  } catch (err) {
    next(err);
  }
}

export async function removeProjectMember(req, res, next) {
  try {
    const project = await req
      .scopedFindOne(Project, { _id: req.params.id })
      .lean();

    if (!project) {
      throw notFound();
    }

    if (project.ownerId.toString() === req.body.userId) {
      throw badRequest("Cannot remove the project owner from members");
    }

    const user = await req
      .scopedFindOne(User, { _id: req.body.userId })
      .lean();

    await req.scopedFindOneAndUpdate(
      Project,
      { _id: req.params.id },
      { $pull: { members: req.body.userId } }
    );

    const updated = await loadProjectWithMembers(req, req.params.id);

    res.json({ project: formatProject(updated) });
  } catch (err) {
    next(err);
  }
}

import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";
import { revokeAllRefreshTokens } from "../services/token.service.js";
import { buildTasksByProject } from "../services/taskOverviewStats.service.js";

const TEAM_ROLES = ["org_admin", "project_manager", "team_member"];

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function getOrgOverview(req, res, next) {
  try {
    const organizationId = new mongoose.Types.ObjectId(req.user.organizationId);

    const [
      projectTotal,
      projectActive,
      projectArchived,
      teamSize,
      projects,
      taskCountRows,
    ] = await Promise.all([
      req.scopedQuery(Project).countDocuments(),
      req.scopedQuery(Project, { status: "active" }).countDocuments(),
      req.scopedQuery(Project, { status: "archived" }).countDocuments(),
      req
        .scopedQuery(User, { role: { $in: TEAM_ROLES } })
        .countDocuments(),
      req.scopedQuery(Project).select("name columns").lean(),
      Task.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: { projectId: "$projectId", status: "$status" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const tasksByProject = buildTasksByProject(projects, taskCountRows);

    const recentProjects = await req
      .scopedQuery(Project)
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("name status updatedAt")
      .lean();

    res.json({
      projects: {
        total: projectTotal,
        active: projectActive,
        archived: projectArchived,
      },
      teamSize,
      tasksByProject,
      recentProjects: recentProjects.map((project) => ({
        id: project._id.toString(),
        name: project.name,
        status: project.status,
        updatedAt: project.updatedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await req
      .scopedQuery(User)
      .select("name email role isActive createdAt")
      .sort({ createdAt: -1 });

    res.json({ users: users.map(formatUser) });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await req
      .scopedFindOne(User, { _id: req.params.id })
      .select("name email role isActive createdAt");

    if (!user) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }

    res.json({ user: formatUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const user = await req.scopedFindOne(User, { _id: req.params.id });

    if (!user) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }

    if (user._id.toString() === req.user.userId) {
      const err = new Error("You cannot change your own role");
      err.status = 400;
      throw err;
    }

    const previousRole = user.role;
    if (previousRole === req.body.role) {
      return res.json({ user: formatUser(user) });
    }

    user.role = req.body.role;
    await user.save();

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "user.role_changed",
      targetType: "User",
      targetId: user._id,
      metadata: { from: previousRole, to: req.body.role },
      ip: getClientIp(req),
    });

    res.json({ user: formatUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function removeUser(req, res, next) {
  try {
    const user = await req.scopedFindOne(User, { _id: req.params.id });

    if (!user) {
      const err = new Error("Not found");
      err.status = 404;
      throw err;
    }

    if (user._id.toString() === req.user.userId) {
      const err = new Error("You cannot remove yourself");
      err.status = 400;
      throw err;
    }

    if (user.role === "org_admin") {
      const adminCount = await User.countDocuments({
        organizationId: req.user.organizationId,
        role: "org_admin",
        isActive: true,
      });

      if (adminCount <= 1) {
        const err = new Error("Cannot remove the last organization admin");
        err.status = 400;
        throw err;
      }
    }

    const removedUser = formatUser(user);
    await revokeAllRefreshTokens(user._id);
    await user.deleteOne();

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "user.removed",
      targetType: "User",
      targetId: user._id,
      metadata: { email: removedUser.email, role: removedUser.role },
      ip: getClientIp(req),
    });

    res.json({ message: "User removed", user: removedUser });
  } catch (err) {
    next(err);
  }
}

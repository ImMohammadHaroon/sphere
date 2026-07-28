import mongoose from "mongoose";
import { COLLECTIONS } from "../config/collections.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import {
  buildBurndownSeries,
  buildVelocitySeries,
  getProjectColumns,
  getTaskCompletionEvents,
  startOfUtcDay,
  toObjectId,
} from "../services/reportAggregation.service.js";

function notFound(message = "Not found") {
  const err = new Error(message);
  err.status = 404;
  return err;
}

function parsePagination(query = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function loadProjectById(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw notFound();
  }

  const project = await Project.findById(projectId).lean();
  if (!project) {
    throw notFound();
  }

  return project;
}

function resolveProjectDateRange(project) {
  const projectStart = startOfUtcDay(
    project.startDate ? new Date(project.startDate) : new Date(project.createdAt)
  );
  const projectDue = startOfUtcDay(
    project.dueDate ? new Date(project.dueDate) : new Date()
  );

  if (projectDue < projectStart) {
    return { projectStart, projectDue: projectStart };
  }

  return { projectStart, projectDue };
}

async function buildWorkloadForProject(project) {
  const columns = getProjectColumns(project);
  const organizationId = toObjectId(project.organizationId);
  const projectId = toObjectId(project._id);

  const rows = await Task.aggregate([
    {
      $match: {
        organizationId,
        projectId,
      },
    },
    {
      $group: {
        _id: {
          assigneeId: "$assigneeId",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const byAssignee = new Map();

  for (const row of rows) {
    const assigneeKey =
      row._id.assigneeId == null
        ? "unassigned"
        : row._id.assigneeId.toString();

    if (!byAssignee.has(assigneeKey)) {
      byAssignee.set(assigneeKey, {
        assigneeId: assigneeKey === "unassigned" ? null : assigneeKey,
        statusCounts: new Map(),
        totalAssigned: 0,
      });
    }

    const bucket = byAssignee.get(assigneeKey);
    bucket.statusCounts.set(row._id.status, row.count);
    bucket.totalAssigned += row.count;
  }

  const assigneeIds = [...byAssignee.keys()]
    .filter((key) => key !== "unassigned")
    .map((id) => new mongoose.Types.ObjectId(id));

  const users =
    assigneeIds.length > 0
      ? await User.find({
          _id: { $in: assigneeIds },
          organizationId,
        })
          .select("name email")
          .lean()
      : [];

  const userById = new Map(users.map((user) => [user._id.toString(), user]));

  return [...byAssignee.entries()]
    .map(([key, bucket]) => {
      const user = key === "unassigned" ? null : userById.get(key);
      const byColumn = columns.map((column) => ({
        key: column.key,
        name: column.name,
        color: column.color,
        count: bucket.statusCounts.get(column.key) ?? 0,
      }));

      for (const [status, count] of bucket.statusCounts.entries()) {
        if (!byColumn.some((column) => column.key === status)) {
          byColumn.push({
            key: status,
            name: status,
            color: "gray",
            count,
          });
        }
      }

      return {
        assigneeId: bucket.assigneeId,
        assigneeName: user?.name ?? "Unassigned",
        assigneeEmail: user?.email ?? null,
        totalAssigned: bucket.totalAssigned,
        byColumn,
      };
    })
    .sort((a, b) => {
      if (a.assigneeId == null) return 1;
      if (b.assigneeId == null) return -1;
      return b.totalAssigned - a.totalAssigned;
    });
}

function formatPlatformProject(project) {
  return {
    _id: project._id.toString(),
    name: project.name,
    organizationId: project.organizationId?.toString?.() ?? project.organizationId,
    organizationName: project.organizationName ?? null,
    status: project.status,
    createdAt: project.createdAt,
    taskCount: project.taskCount ?? 0,
  };
}

/**
 * GET /platform/projects
 * Access: super_admin only (enforced at router mount).
 */
export async function listPlatformProjects(req, res, next) {
  try {
    const query = req.validatedQuery ?? {};
    const { page, limit, skip } = parsePagination(query);
    const match = {};

    if (query.search) {
      match.name = { $regex: query.search, $options: "i" };
    }

    if (query.organizationId) {
      match.organizationId = new mongoose.Types.ObjectId(query.organizationId);
    }

    const [result] = await Project.aggregate([
      { $match: match },
      {
        $lookup: {
          from: COLLECTIONS.ORGANIZATIONS,
          localField: "organizationId",
          foreignField: "_id",
          as: "organization",
        },
      },
      {
        $unwind: {
          path: "$organization",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: COLLECTIONS.TASKS,
          localField: "_id",
          foreignField: "projectId",
          as: "tasks",
        },
      },
      {
        $addFields: {
          taskCount: { $size: "$tasks" },
          organizationName: "$organization.name",
        },
      },
      { $sort: { updatedAt: -1 } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                name: 1,
                organizationId: 1,
                organizationName: 1,
                status: 1,
                createdAt: 1,
                taskCount: 1,
              },
            },
          ],
          meta: [{ $count: "total" }],
        },
      },
    ]);

    const total = result.meta[0]?.total ?? 0;

    res.json({
      projects: (result.data ?? []).map(formatPlatformProject),
      total,
      page,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /platform/projects/:id/reports/burndown
 * Access: super_admin only (enforced at router mount).
 */
export async function getProjectBurndown(req, res, next) {
  try {
    const project = await loadProjectById(req.params.id);
    const { projectStart, projectDue } = resolveProjectDateRange(project);

    const totalScope = await Task.countDocuments({
      projectId: project._id,
      organizationId: project.organizationId,
    });

    const completionEvents = await getTaskCompletionEvents(
      project._id,
      project.organizationId
    );

    const series = buildBurndownSeries({
      projectStart,
      projectDue,
      totalScope,
      completionEvents,
    });

    res.json({
      series,
      totalScope,
      projectStart,
      projectDue,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /platform/projects/:id/reports/velocity
 * Access: super_admin only (enforced at router mount).
 */
export async function getProjectVelocity(req, res, next) {
  try {
    const project = await loadProjectById(req.params.id);

    const completionEvents = await getTaskCompletionEvents(
      project._id,
      project.organizationId
    );

    res.json({
      series: buildVelocitySeries(completionEvents, 8),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /platform/projects/:id/reports/workload
 * Access: super_admin only (enforced at router mount).
 */
export async function getProjectWorkload(req, res, next) {
  try {
    const project = await loadProjectById(req.params.id);
    const workload = await buildWorkloadForProject(project);

    res.json({ workload });
  } catch (err) {
    next(err);
  }
}

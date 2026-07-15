import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { isProjectMember } from "../utils/projectAccess.js";
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

async function loadProjectWithMembers(req, projectId) {
  return req
    .scopedFindOne(Project, { _id: projectId })
    .populate("members", "name email role")
    .lean();
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

/**
 * GET /projects/:id/reports/burndown
 * Access: org_admin | project_manager | client (must be project member).
 */
export async function getProjectBurndown(req, res, next) {
  try {
    const project = await assertProjectReadable(req, req.params.id);
    const { projectStart, projectDue } = resolveProjectDateRange(project);

    // v1: totalScope is current task count (not reconstructed historical scope).
    const totalScope = await req
      .scopedQuery(Task, { projectId: project._id })
      .countDocuments();

    const completionEvents = await getTaskCompletionEvents(
      project._id,
      req.user.organizationId
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
 * GET /projects/:id/reports/velocity
 * Access: org_admin | project_manager.
 */
export async function getProjectVelocity(req, res, next) {
  try {
    await assertProjectReadable(req, req.params.id);

    const completionEvents = await getTaskCompletionEvents(
      req.params.id,
      req.user.organizationId
    );

    res.json({
      series: buildVelocitySeries(completionEvents, 8),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /projects/:id/reports/workload
 * Access: org_admin | project_manager.
 */
export async function getProjectWorkload(req, res, next) {
  try {
    const project = await assertProjectReadable(req, req.params.id);
    const columns = getProjectColumns(project);
    const organizationId = toObjectId(req.user.organizationId);
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

    const userById = new Map(
      users.map((user) => [user._id.toString(), user])
    );

    const workload = [...byAssignee.entries()]
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

    res.json({ workload });
  } catch (err) {
    next(err);
  }
}

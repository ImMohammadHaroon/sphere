import { Milestone } from "../models/Milestone.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { isProjectMember } from "../utils/projectAccess.js";
import { formatTask } from "./task.controller.js";
import { formatMilestone } from "./milestone.controller.js";

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

function startOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0)
  );
}

function endOfUtcDay(date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)
  );
  return { start, end };
}

function resolveRange(query = {}) {
  const defaults = currentMonthRange();
  const start = query.start
    ? startOfUtcDay(query.start)
    : startOfUtcDay(defaults.start);
  const end = query.end
    ? endOfUtcDay(query.end)
    : endOfUtcDay(defaults.end);
  return { start, end };
}

export async function getProjectCalendar(req, res, next) {
  try {
    await assertProjectReadable(req, req.params.id);

    const { start, end } = resolveRange(req.validatedQuery);
    const dueDateFilter = { $gte: start, $lte: end, $ne: null };
    const projectId = req.params.id;

    const [tasks, milestones] = await Promise.all([
      req
        .scopedQuery(Task, { projectId, dueDate: dueDateFilter })
        .populate("assigneeId", "name email")
        .sort({ dueDate: 1 })
        .lean(),
      req
        .scopedQuery(Milestone, { projectId, dueDate: dueDateFilter })
        .sort({ dueDate: 1 })
        .lean(),
    ]);

    res.json({
      tasks: tasks.map(formatTask),
      milestones: milestones.map(formatMilestone),
    });
  } catch (err) {
    next(err);
  }
}

import mongoose from "mongoose";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { DEFAULT_BOARD_COLUMNS, copyColumns } from "./kanbanTemplate.service.js";

/**
 * Returns the kanban column key marked isDone === true for a project.
 * Falls back to null when the board has no done column configured.
 */
export function getDoneColumnKey(project) {
  const columns = project?.columns?.length
    ? project.columns
    : DEFAULT_BOARD_COLUMNS;
  return columns.find((column) => column.isDone === true)?.key ?? null;
}

export function isDoneColumn(project, statusKey) {
  return getDoneColumnKey(project) === statusKey;
}

export function getProjectColumns(project) {
  if (project?.columns?.length) {
    return copyColumns(project.columns);
  }
  return copyColumns(DEFAULT_BOARD_COLUMNS);
}

function toObjectId(value) {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }
  return new mongoose.Types.ObjectId(value);
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

/** Monday-based ISO week start (UTC). */
export function startOfIsoWeekUtc(date) {
  const day = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const weekday = day.getUTCDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  day.setUTCDate(day.getUTCDate() + diff);
  return day;
}

export function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function eachUtcDay(start, end) {
  const days = [];
  let cursor = startOfUtcDay(start);
  const last = startOfUtcDay(end);

  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor = addUtcDays(cursor, 1);
  }

  return days;
}

export function formatUtcDate(date) {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

/**
 * Completion events for a single project.
 * Uses task.updatedAt for tasks currently in the done column.
 *
 * @returns {Promise<Array<{ taskId: string, completedAt: Date }>>}
 */
export async function getTaskCompletionEvents(projectId, organizationId) {
  const orgId = toObjectId(organizationId);
  const projId = toObjectId(projectId);

  const project = await Project.findOne({
    _id: projId,
    organizationId: orgId,
  })
    .select("columns")
    .lean();

  if (!project) {
    return [];
  }

  const doneKey = getDoneColumnKey(project);
  if (!doneKey) {
    return [];
  }

  const tasks = await Task.find({
    projectId: projId,
    organizationId: orgId,
    status: doneKey,
  })
    .select("_id updatedAt")
    .lean();

  return tasks
    .filter((task) => task.updatedAt)
    .map((task) => ({
      taskId: task._id.toString(),
      completedAt: task.updatedAt,
    }));
}

/**
 * Org-wide completion events across all projects (same earliest-done rules).
 */
export async function getOrganizationTaskCompletionEvents(organizationId) {
  const orgId = toObjectId(organizationId);
  const projects = await Project.find({ organizationId: orgId })
    .select("_id columns")
    .lean();

  if (projects.length === 0) {
    return [];
  }

  const results = await Promise.all(
    projects.map((project) =>
      getTaskCompletionEvents(project._id, organizationId)
    )
  );

  return results.flat();
}

/**
 * Build burndown series from start→due.
 * v1 simplification: totalScope is the *current* task count, not historical scope
 * at each day — scope changes mid-project are not reconstructed.
 */
export function buildBurndownSeries({
  projectStart,
  projectDue,
  totalScope,
  completionEvents,
}) {
  const days = eachUtcDay(projectStart, projectDue);
  const denominator = Math.max(days.length - 1, 1);

  const completedAtSorted = (completionEvents ?? [])
    .map((event) => new Date(event.completedAt).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => a - b);

  return days.map((day, index) => {
    const dayEnd = endOfUtcDay(day).getTime();
    let completedByDay = 0;
    for (const time of completedAtSorted) {
      if (time <= dayEnd) {
        completedByDay += 1;
      } else {
        break;
      }
    }

    const ideal =
      totalScope === 0
        ? 0
        : Math.round((totalScope * (1 - index / denominator)) * 100) / 100;

    return {
      date: formatUtcDate(day),
      ideal,
      actual: Math.max(totalScope - completedByDay, 0),
    };
  });
}

/**
 * Last N ISO weeks of velocity from completion events.
 */
export function buildVelocitySeries(completionEvents, weekCount = 8) {
  const now = new Date();
  const currentWeekStart = startOfIsoWeekUtc(now);
  const weeks = [];

  for (let i = weekCount - 1; i >= 0; i -= 1) {
    const weekStart = addUtcDays(currentWeekStart, -7 * i);
    const weekEnd = endOfUtcDay(addUtcDays(weekStart, 6));
    const weekStartMs = weekStart.getTime();
    const weekEndMs = weekEnd.getTime();

    const tasksCompleted = (completionEvents ?? []).filter((event) => {
      const time = new Date(event.completedAt).getTime();
      return time >= weekStartMs && time <= weekEndMs;
    }).length;

    weeks.push({
      weekStart: formatUtcDate(weekStart),
      weekLabel: `Week of ${formatUtcDate(weekStart)}`,
      tasksCompleted,
    });
  }

  return weeks;
}

/**
 * Daily completion counts for the last `dayCount` days (inclusive of today).
 */
export function buildCompletionTrend(completionEvents, dayCount = 30) {
  const today = startOfUtcDay(new Date());
  const start = addUtcDays(today, -(dayCount - 1));
  const days = eachUtcDay(start, today);

  return days.map((day) => {
    const dayStart = startOfUtcDay(day).getTime();
    const dayEnd = endOfUtcDay(day).getTime();
    const tasksCompleted = (completionEvents ?? []).filter((event) => {
      const time = new Date(event.completedAt).getTime();
      return time >= dayStart && time <= dayEnd;
    }).length;

    return {
      date: formatUtcDate(day),
      tasksCompleted,
    };
  });
}

export function countCompletedInWindow(completionEvents, since) {
  const sinceMs = new Date(since).getTime();
  return (completionEvents ?? []).filter(
    (event) => new Date(event.completedAt).getTime() >= sinceMs
  ).length;
}

/**
 * Split task status counts into done vs not-done using each project's own done key.
 */
export function summarizeDoneNotDone(projects, taskCountRows) {
  const doneKeysByProject = new Map();
  for (const project of projects) {
    doneKeysByProject.set(project._id.toString(), getDoneColumnKey(project));
  }

  let totalTasks = 0;
  let tasksDone = 0;

  for (const row of taskCountRows) {
    const projectId =
      row._id.projectId?.toString?.() ?? String(row._id.projectId);
    const count = row.count ?? 0;
    totalTasks += count;
    if (row._id.status === doneKeysByProject.get(projectId)) {
      tasksDone += count;
    }
  }

  return {
    totalTasks,
    tasksDone,
    tasksNotDone: totalTasks - tasksDone,
    taskCompletionRate: totalTasks === 0 ? 0 : tasksDone / totalTasks,
  };
}

/**
 * Month buckets for org registration growth (last `monthCount` months, UTC).
 */
export function buildMonthBuckets(monthCount = 6) {
  const now = new Date();
  const buckets = [];

  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999)
    );
    buckets.push({
      monthStart: formatUtcDate(start),
      monthLabel: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      start,
      end,
    });
  }

  return buckets;
}

export { startOfUtcDay, endOfUtcDay, toObjectId };

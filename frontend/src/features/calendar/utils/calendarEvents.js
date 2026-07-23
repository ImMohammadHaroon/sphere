import { format, parseISO } from "date-fns";
import { isTaskDone } from "@/lib/taskStatusConfig";

export function toDateKey(value) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "yyyy-MM-dd");
}

export function getDayEvents({ day, tasks, milestones, completedTasks, columns }) {
  const key = format(day, "yyyy-MM-dd");

  const scheduledTasks = (tasks ?? []).filter((task) => {
    if (toDateKey(task.dueDate) !== key) return false;
    return !isTaskDone({ ...task, projectId: { columns } });
  });

  const doneTasks = (completedTasks ?? []).filter(
    (task) => toDateKey(task.updatedAt) === key
  );

  const dayMilestones = (milestones ?? []).filter(
    (milestone) => toDateKey(milestone.dueDate) === key
  );

  return {
    scheduledTasks,
    doneTasks,
    milestones: dayMilestones,
    totalCount:
      scheduledTasks.length + doneTasks.length + dayMilestones.length,
  };
}

export function summarizeDayEvents(events, limit = 3) {
  const items = [
    ...events.scheduledTasks.map((task) => ({
      id: `task-${task._id}`,
      type: "scheduled",
      label: task.title,
    })),
    ...events.doneTasks.map((task) => ({
      id: `done-${task._id}`,
      type: "done",
      label: task.title,
    })),
    ...events.milestones.map((milestone) => ({
      id: `milestone-${milestone._id}`,
      type: "milestone",
      label: milestone.name,
    })),
  ];

  return {
    visible: items.slice(0, limit),
    overflow: Math.max(items.length - limit, 0),
    total: items.length,
  };
}

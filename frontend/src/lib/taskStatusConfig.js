export const TASK_STATUS_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const TASK_STATUS_COLORS = {
  todo: "hsl(var(--kanban-todo))",
  "in-progress": "hsl(var(--kanban-progress))",
  review: "hsl(var(--kanban-review))",
  done: "hsl(var(--kanban-done))",
};

export const TASK_STATUS_KEYS = Object.keys(TASK_STATUS_LABELS);

export function totalTaskCount(tasksByStatus) {
  return TASK_STATUS_KEYS.reduce(
    (sum, key) => sum + (tasksByStatus?.[key] ?? 0),
    0
  );
}

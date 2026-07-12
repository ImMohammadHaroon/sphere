export const KANBAN_PALETTE = [
  "gray",
  "amber",
  "orange",
  "green",
  "blue",
  "purple",
  "red",
];

export const DEFAULT_BOARD_COLUMNS = [
  { key: "todo", name: "To Do", color: "gray", order: 0, isDone: false },
  {
    key: "in-progress",
    name: "In Progress",
    color: "amber",
    order: 1,
    isDone: false,
  },
  { key: "review", name: "Review", color: "orange", order: 2, isDone: false },
  { key: "done", name: "Done", color: "green", order: 3, isDone: true },
];

export function getPaletteColor(colorName) {
  const name = KANBAN_PALETTE.includes(colorName) ? colorName : "gray";
  return `hsl(var(--kanban-${name}))`;
}

export function getSortedColumns(columns) {
  return [...(columns ?? [])].sort((a, b) => a.order - b.order);
}

export function getStatusLabel(columns, key) {
  const column = columns?.find((c) => c.key === key);
  return column?.name ?? key;
}

export function getStatusColor(columns, key) {
  const column = columns?.find((c) => c.key === key);
  return getPaletteColor(column?.color ?? "gray");
}

export function getDoneKey(columns) {
  return columns?.find((c) => c.isDone)?.key ?? null;
}

export function isDoneStatus(columns, statusKey) {
  const column = columns?.find((c) => c.key === statusKey);
  return column?.isDone === true;
}

export function getTaskProjectColumns(task) {
  if (task?.projectId?.columns?.length) {
    return task.projectId.columns;
  }
  return DEFAULT_BOARD_COLUMNS;
}

export function isTaskDone(task) {
  return isDoneStatus(getTaskProjectColumns(task), task.status);
}

export function rollupTasksByColumnName(tasksByProject) {
  const buckets = new Map();

  for (const project of tasksByProject ?? []) {
    for (const column of project.columns ?? []) {
      const existing = buckets.get(column.name) ?? {
        name: column.name,
        color: column.color,
        count: 0,
      };
      existing.count += column.count ?? 0;
      buckets.set(column.name, existing);
    }
  }

  return Array.from(buckets.values());
}

export function totalTaskCountFromProjects(tasksByProject) {
  return (tasksByProject ?? []).reduce(
    (sum, project) =>
      sum +
      (project.columns ?? []).reduce(
        (columnSum, column) => columnSum + (column.count ?? 0),
        0
      ),
    0
  );
}

export function totalTaskCount(tasksByStatus) {
  return Object.values(tasksByStatus ?? {}).reduce(
    (sum, count) => sum + (count ?? 0),
    0
  );
}

export function createEmptyColumn(color = "gray") {
  return { name: "", color, isDone: false };
}

export const DEFAULT_BUILDER_COLUMNS = [
  { name: "To Do", color: "gray", isDone: false },
  { name: "In Progress", color: "amber", isDone: false },
  { name: "Review", color: "orange", isDone: false },
  { name: "Done", color: "green", isDone: true },
];

import { KanbanTemplate } from "../models/KanbanTemplate.js";
import { slugify } from "../utils/slug.js";

export const KANBAN_COLUMN_COLORS = [
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

export function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function generateColumnKeys(names) {
  const used = new Set();
  return names.map((name) => {
    let base = slugify(name) || "column";
    let candidate = base;
    let suffix = 2;

    while (used.has(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    used.add(candidate);
    return candidate;
  });
}

export function normalizeColumns(inputColumns) {
  const keys = generateColumnKeys(inputColumns.map((c) => c.name));

  const columns = inputColumns.map((col, index) => ({
    key: keys[index],
    name: col.name.trim(),
    color: col.color,
    order: index,
    isDone: col.isDone ?? false,
  }));

  const doneCount = columns.filter((c) => c.isDone).length;
  if (doneCount === 0) {
    columns[columns.length - 1].isDone = true;
  }

  return columns;
}

export function copyColumns(columns) {
  return columns.map((c) => ({
    key: c.key,
    name: c.name,
    color: c.color,
    order: c.order,
    isDone: c.isDone ?? false,
  }));
}

/**
 * Pre-save column invariants: unique keys, at most one isDone,
 * and default the last column (by order) to isDone when none is set.
 * Mutates and returns the columns array.
 */
export function enforceKanbanColumnRules(columns) {
  const keys = columns.map((c) => c.key);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Column keys must be unique within a template");
  }

  const doneColumns = columns.filter((c) => c.isDone);
  if (doneColumns.length > 1) {
    throw new Error("Exactly one column must be marked as done");
  }

  if (doneColumns.length === 0 && columns.length > 0) {
    const sorted = [...columns].sort((a, b) => a.order - b.order);
    const last = sorted[sorted.length - 1];
    const lastInDoc = columns.find((c) => c.key === last.key);
    if (lastInDoc) {
      lastInDoc.isDone = true;
    }
  }

  return columns;
}

export async function createKanbanTemplate({
  organizationId,
  createdBy,
  name,
  columns,
}) {
  const normalized = normalizeColumns(columns);

  const template = await KanbanTemplate.create({
    organizationId,
    createdBy,
    name: name.trim(),
    columns: normalized,
  });

  return template;
}

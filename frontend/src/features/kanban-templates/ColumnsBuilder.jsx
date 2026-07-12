import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  createEmptyColumn,
  getPaletteColor,
  KANBAN_PALETTE,
} from "@/lib/taskStatusConfig";
import { cn } from "@/lib/utils";

export function validateColumnsBuilder(columns) {
  if (!columns?.length) {
    return "At least one column is required.";
  }

  for (const column of columns) {
    if (!column.name?.trim()) {
      return "Every column needs a name.";
    }
  }

  const doneCount = columns.filter((c) => c.isDone).length;
  if (doneCount !== 1) {
    return "Exactly one column must be marked as done.";
  }

  return null;
}

function ColorSwatches({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KANBAN_PALETTE.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          aria-label={`Color ${color}`}
          aria-pressed={value === color}
          className={cn(
            "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
            value === color ? "border-text-primary" : "border-transparent"
          )}
          style={{ backgroundColor: getPaletteColor(color) }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}

export function ColumnsBuilder({ columns, onChange }) {
  function updateColumn(index, patch) {
    const next = columns.map((col, i) =>
      i === index ? { ...col, ...patch } : col
    );
    onChange(next);
  }

  function removeColumn(index) {
    if (columns.length <= 1) return;
    const removed = columns[index];
    let next = columns.filter((_, i) => i !== index);
    if (removed.isDone && next.length > 0) {
      next = next.map((col, i) => ({ ...col, isDone: i === next.length - 1 }));
    }
    onChange(next);
  }

  function moveColumn(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const next = [...columns];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addColumn() {
    onChange([...columns, createEmptyColumn()]);
  }

  function setDoneColumn(index) {
    onChange(columns.map((col, i) => ({ ...col, isDone: i === index })));
  }

  return (
    <div className="space-y-3">
      <Label>Columns</Label>
      <div className="space-y-3">
        {columns.map((column, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-surface p-3 space-y-3"
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-3">
                <Input
                  value={column.name}
                  onChange={(e) => updateColumn(index, { name: e.target.value })}
                  placeholder="Column name"
                  aria-label={`Column ${index + 1} name`}
                />
                <ColorSwatches
                  value={column.color}
                  onChange={(color) => updateColumn(index, { color })}
                />
                <label className="flex items-center gap-2 text-sm text-text-secondary">
                  <input
                    type="radio"
                    name="done-column"
                    checked={column.isDone}
                    onChange={() => setDoneColumn(index)}
                    className="text-primary focus:ring-primary"
                  />
                  Done column
                </label>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={index === 0}
                  onClick={() => moveColumn(index, -1)}
                  aria-label="Move column up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={index === columns.length - 1}
                  onClick={() => moveColumn(index, 1)}
                  aria-label="Move column down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-danger hover:text-danger"
                  disabled={columns.length <= 1}
                  onClick={() => removeColumn(index)}
                  aria-label="Remove column"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addColumn}>
        Add column
      </Button>
    </div>
  );
}

export function ColumnColorDots({ columns, className }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {columns.map((column, index) => (
        <span
          key={column.key ?? index}
          title={column.name}
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: getPaletteColor(column.color) }}
        />
      ))}
    </div>
  );
}

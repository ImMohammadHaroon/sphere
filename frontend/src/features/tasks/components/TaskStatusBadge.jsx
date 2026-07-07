import { TASK_STATUS_COLORS, TASK_STATUS_LABELS } from "@/lib/taskStatusConfig";
import { cn } from "@/lib/utils";

export function TaskStatusBadge({ status, className }) {
  const color = TASK_STATUS_COLORS[status] ?? TASK_STATUS_COLORS.todo;
  const label = TASK_STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-text-primary",
        className
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}

import { getStatusColor, getStatusLabel } from "@/lib/taskStatusConfig";
import { cn } from "@/lib/utils";

export function TaskStatusBadge({ status, columns, className }) {
  const color = getStatusColor(columns, status);
  const label = getStatusLabel(columns, status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
      }}
    >
      {label}
    </span>
  );
}

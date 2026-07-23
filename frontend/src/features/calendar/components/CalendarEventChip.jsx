import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const chipStyles = {
  scheduled:
    "border-l-[3px] border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  done: "border-l-[3px] border-l-green-500 bg-green-50 text-green-900 dark:bg-green-950/40 dark:text-green-100",
  milestone:
    "border-l-[3px] border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
};

export function CalendarEventChip({ type, label, className }) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight sm:text-[11px]",
        chipStyles[type] ?? chipStyles.scheduled,
        className
      )}
      title={label}
    >
      {type === "done" ? (
        <Icon icon="lucide:check" className="h-2.5 w-2.5 shrink-0" />
      ) : null}
      {type === "milestone" ? (
        <Icon icon="lucide:flag" className="h-2.5 w-2.5 shrink-0" />
      ) : null}
      <span className="truncate">{label}</span>
    </div>
  );
}

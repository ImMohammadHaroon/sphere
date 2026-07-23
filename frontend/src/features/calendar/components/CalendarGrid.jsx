import { format, isSameDay, isSameMonth, isToday } from "date-fns";
import { CalendarEventChip } from "@/features/calendar/components/CalendarEventChip";
import {
  getDayEvents,
  summarizeDayEvents,
} from "@/features/calendar/utils/calendarEvents";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarGrid({
  visibleMonth,
  gridDays,
  tasks,
  milestones,
  completedTasks,
  columns,
  selectedDay,
  onSelectDay,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-border bg-surface">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-medium text-text-secondary"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {gridDays.map((day) => {
          const events = getDayEvents({
            day,
            tasks,
            milestones,
            completedTasks,
            columns,
          });
          const summary = summarizeDayEvents(events);
          const inMonth = isSameMonth(day, visibleMonth);
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={cn(
                "min-h-[7.5rem] border-b border-r border-border bg-card p-1.5 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 sm:min-h-[8.5rem] sm:p-2",
                !inMonth && "bg-surface/50",
                isToday(day) && "bg-primary-subtle/30",
                isSelected && "ring-2 ring-inset ring-primary/50"
              )}
            >
              <span
                className={cn(
                  "mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday(day) && "bg-primary text-white",
                  !isToday(day) && inMonth && "text-text-primary",
                  !inMonth && "text-text-muted"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="space-y-0.5">
                {summary.visible.map((item) => (
                  <CalendarEventChip
                    key={item.id}
                    type={item.type}
                    label={item.label}
                  />
                ))}
                {summary.overflow > 0 ? (
                  <p className="px-1 text-[10px] font-medium text-text-muted">
                    +{summary.overflow} more
                  </p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

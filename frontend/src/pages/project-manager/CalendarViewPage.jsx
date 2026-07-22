import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useProject, useProjects } from "@/features/projects/hooks/useProjects";
import { useProjectCalendar } from "@/features/projects/hooks/useProjectCalendar";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { getStatusColor } from "@/lib/taskStatusConfig";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(value) {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, "yyyy-MM-dd");
}

function dayEvents(tasks, milestones, day) {
  const key = format(day, "yyyy-MM-dd");
  return {
    tasks: (tasks ?? []).filter((task) => toDateKey(task.dueDate) === key),
    milestones: (milestones ?? []).filter(
      (milestone) => toDateKey(milestone.dueDate) === key
    ),
  };
}

export function CalendarViewPage() {
  const navigate = useNavigate();
  const { id, projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId =
    routeProjectId || id || searchParams.get("projectId") || "";

  useDashboardPageMeta({
    title: "Calendar view",
    description: "See deadlines and milestones on a calendar.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/dashboard/calendar" : undefined,
  });

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const range = useMemo(
    () => ({
      start: format(monthStart, "yyyy-MM-dd"),
      end: format(monthEnd, "yyyy-MM-dd"),
    }),
    [monthStart, monthEnd]
  );

  const {
    data: projects,
    isLoading: projectsLoading,
  } = useProjects();

  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErr,
    refetch: refetchProject,
    isFetching: projectFetching,
  } = useProject(projectId);

  const {
    data: calendar,
    isLoading: calendarLoading,
    isError: calendarError,
    error: calendarErr,
    refetch: refetchCalendar,
    isFetching: calendarFetching,
  } = useProjectCalendar(projectId, range);

  const gridDays = useMemo(() => {
    const start = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const columns = project?.columns ?? [];
  const tasks = calendar?.tasks ?? [];
  const milestones = calendar?.milestones ?? [];

  const selectedEvents = selectedDay
    ? dayEvents(tasks, milestones, selectedDay)
    : { tasks: [], milestones: [] };

  const isLoading = !!projectId && (projectLoading || calendarLoading);
  const isError = !!projectId && (projectError || calendarError);
  const error = projectErr || calendarErr;

  function handleProjectChange(nextId) {
    if (!nextId) {
      navigate("/dashboard/calendar");
      return;
    }
    navigate(`/dashboard/projects/${nextId}/calendar`);
  }

  return (
    <>
      {projectId ? (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous month"
            onClick={() => setVisibleMonth((m) => startOfMonth(subMonths(m, 1)))}
          >
            <Icon icon="lucide:chevron-left" className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVisibleMonth(startOfMonth(new Date()))}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next month"
            onClick={() => setVisibleMonth((m) => startOfMonth(addMonths(m, 1)))}
          >
            <Icon icon="lucide:chevron-right" className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[9rem] text-center text-sm font-medium text-text-primary sm:text-base">
            {format(visibleMonth, "MMMM yyyy")}
          </h2>
        </div>
      ) : null}

      {projectsLoading && !projectId ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : null}

      {!projectsLoading && !projectId ? (
        <ProjectPicker
          projects={projects ?? []}
          getProjectHref={(project) =>
            `/dashboard/projects/${project._id}/calendar`
          }
          actionLabel="Open calendar"
          emptyTitle="No projects yet"
          emptyDescription="Create a project to view its task deadlines and milestones."
        />
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[28rem] w-full" />
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : "Failed to load calendar."}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              refetchProject();
              refetchCalendar();
            }}
            isLoading={projectFetching || calendarFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {projectId && !isLoading && !isError ? (
        <Card className="overflow-hidden p-0">
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
              const events = dayEvents(tasks, milestones, day);
              const inMonth = isSameMonth(day, visibleMonth);
              const hasEvents =
                events.tasks.length > 0 || events.milestones.length > 0;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[5.5rem] border-b border-r border-border bg-card p-2 text-left transition-colors hover:bg-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                    !inMonth && "bg-surface/50 text-text-muted",
                    isToday(day) && "bg-primary-subtle/40"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday(day) && "bg-primary text-white",
                      !isToday(day) && inMonth && "text-text-primary",
                      !inMonth && "text-text-muted"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {hasEvents ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {events.tasks.map((task) => (
                        <span
                          key={task._id}
                          title={task.title}
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: getStatusColor(
                              columns,
                              task.status
                            ),
                          }}
                        />
                      ))}
                      {events.milestones.map((milestone) => (
                        <Icon
                          key={milestone._id}
                          icon="lucide:flag"
                          className="h-3 w-3 text-text-secondary"
                          title={milestone.name}
                        />
                      ))}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>
      ) : null}

      <Dialog
        open={!!selectedDay}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
      >
        <DialogContent onClose={() => setSelectedDay(null)}>
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? format(selectedDay, "EEEE, MMM d, yyyy")
                : "Day details"}
            </DialogTitle>
            <DialogDescription>
              Tasks and milestones due on this day.
            </DialogDescription>
          </DialogHeader>

          {selectedEvents.tasks.length === 0 &&
          selectedEvents.milestones.length === 0 ? (
            <p className="text-sm text-text-secondary">
              Nothing due on this day.
            </p>
          ) : (
            <div className="space-y-4">
              {selectedEvents.tasks.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-text-primary">
                    Tasks
                  </h3>
                  <ul className="divide-hover rounded-lg border border-border">
                    {selectedEvents.tasks.map((task) => (
                      <li key={task._id}>
                        <Link
                          to={`/dashboard/projects/${projectId}/tasks/${task._id}`}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                          onClick={() => setSelectedDay(null)}
                        >
                          <span className="font-medium text-text-primary">
                            {task.title}
                          </span>
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: getStatusColor(
                                columns,
                                task.status
                              ),
                            }}
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedEvents.milestones.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-text-primary">
                    Milestones
                  </h3>
                  <ul className="divide-hover rounded-lg border border-border">
                    {selectedEvents.milestones.map((milestone) => (
                      <li key={milestone._id}>
                        <Link
                          to={`/dashboard/projects/${projectId}/milestones?highlight=${milestone._id}`}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                          onClick={() => setSelectedDay(null)}
                        >
                          <span className="flex items-center gap-2 font-medium text-text-primary">
                            <Icon
                              icon="lucide:flag"
                              className="h-3.5 w-3.5 text-text-secondary"
                            />
                            {milestone.name}
                          </span>
                          <Badge variant="muted">{milestone.status}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

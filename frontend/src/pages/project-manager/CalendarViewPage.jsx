import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { CalendarGrid } from "@/features/calendar/components/CalendarGrid";
import { DaySchedulerPanel } from "@/features/calendar/components/DaySchedulerPanel";
import { getDayEvents } from "@/features/calendar/utils/calendarEvents";
import { useProject, useProjects } from "@/features/projects/hooks/useProjects";
import { useProjectCalendar } from "@/features/projects/hooks/useProjectCalendar";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { toDateInputValue } from "@/lib/dateFormHelpers";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function CalendarViewPage() {
  const { id, projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId =
    routeProjectId || id || searchParams.get("projectId") || "";

  useDashboardPageMeta({
    title: "Calendar view",
    description: "Schedule work and review what was completed each day.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/dashboard/calendar" : undefined,
  });

  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date())
  );
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [createOpen, setCreateOpen] = useState(false);

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const range = useMemo(
    () => ({
      start: format(monthStart, "yyyy-MM-dd"),
      end: format(monthEnd, "yyyy-MM-dd"),
    }),
    [monthStart, monthEnd]
  );

  const { data: projects, isLoading: projectsLoading } = useProjects();

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
  const completedTasks = calendar?.completedTasks ?? [];

  const selectedEvents = selectedDay
    ? getDayEvents({
        day: selectedDay,
        tasks,
        milestones,
        completedTasks,
        columns,
      })
    : { scheduledTasks: [], doneTasks: [], milestones: [], totalCount: 0 };

  const isLoading = !!projectId && (projectLoading || calendarLoading);
  const isError = !!projectId && (projectError || calendarError);
  const error = projectErr || calendarErr;

  const defaultDueDate = selectedDay ? toDateInputValue(selectedDay) : "";

  return (
    <>
      {projectId ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary">
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Scheduled
            </span>
            <span className="mr-3 inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
              Milestones
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Previous month"
              onClick={() =>
                setVisibleMonth((month) => startOfMonth(subMonths(month, 1)))
              }
            >
              <Icon icon="lucide:chevron-left" className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setVisibleMonth(startOfMonth(today));
                setSelectedDay(today);
              }}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Next month"
              onClick={() =>
                setVisibleMonth((month) => startOfMonth(addMonths(month, 1)))
              }
            >
              <Icon icon="lucide:chevron-right" className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[9rem] text-center text-sm font-medium text-text-primary sm:text-base">
              {format(visibleMonth, "MMMM yyyy")}
            </h2>
          </div>
        </div>
      ) : null}

      {projectsLoading && !projectId ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : null}

      {!projectsLoading && !projectId ? (
        <ProjectPicker
          projects={projects ?? []}
          getProjectHref={(item) =>
            `/dashboard/projects/${item._id}/calendar`
          }
          actionLabel="Open calendar"
          emptyTitle="No projects yet"
          emptyDescription="Create a project to schedule tasks and track daily progress."
        />
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-[32rem] w-full" />
          <Skeleton className="h-[32rem] w-full" />
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
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
          <CalendarGrid
            visibleMonth={visibleMonth}
            gridDays={gridDays}
            tasks={tasks}
            milestones={milestones}
            completedTasks={completedTasks}
            columns={columns}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />

          <DaySchedulerPanel
            day={selectedDay}
            events={selectedEvents}
            projectId={projectId}
            columns={columns}
            onAddSchedule={() => setCreateOpen(true)}
          />
        </div>
      ) : null}

      <CreateTaskModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        defaultDueDate={defaultDueDate}
      />
    </>
  );
}

import { useEffect, useRef } from "react";
import { CalendarDays, MessageSquare, UserPen, UserRound, X } from "lucide-react";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { TaskComments } from "@/features/tasks/components/TaskComments";
import { useTask } from "@/features/tasks/hooks/useTask";
import { useProject } from "@/features/projects/hooks/useProjects";
import { getTaskProjectColumns } from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ApiError } from "@/lib/apiClient";

function priorityBadgeVariant(priority) {
  switch (priority) {
    case "high":
      return "danger";
    case "low":
      return "muted";
    default:
      return "default";
  }
}

function formatDate(value) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-dashboard-accent/25 bg-dashboard-accent-subtle/20 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-accent text-white shadow-sm">
        <MessageSquare className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-text-primary">
        Task discussion
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
        Select any task on the board above to view its details and join the
        conversation with your team.
      </p>
    </Card>
  );
}

export function KanbanTaskPanel({ taskId, projectId, onClose }) {
  const sectionRef = useRef(null);
  const { data: task, isLoading, isError, error } = useTask(taskId);
  const { data: project } = useProject(projectId);

  const columns =
    project?.columns?.length > 0
      ? project.columns
      : getTaskProjectColumns(task);

  const notFound =
    isError && error instanceof ApiError && error.status === 404;

  useEffect(() => {
    if (!taskId || !sectionRef.current) {
      return;
    }

    sectionRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [taskId]);

  if (!taskId) {
    return <EmptyState />;
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Selected task details and comments"
      className="scroll-mt-6"
    >
      <Card className="overflow-hidden p-0">
        <div className="border-b border-dashboard-accent/15 bg-gradient-to-r from-dashboard-accent-subtle/60 via-surface-raised/40 to-surface px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                Selected task
              </p>
              <h2 className="text-xl font-semibold text-text-primary sm:text-2xl">
                {task?.title ?? "Loading task…"}
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={onClose}
            >
              <X className="mr-1.5 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-6 px-5 py-5 sm:px-6 sm:py-6">
          {isLoading ? <PanelSkeleton /> : null}

          {notFound ? (
            <Alert variant="error">This task could not be found.</Alert>
          ) : null}

          {isError && !notFound ? (
            <Alert variant="error">
              {error instanceof Error ? error.message : "Failed to load task."}
            </Alert>
          ) : null}

          {!isLoading && !isError && task ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <TaskStatusBadge status={task.status} columns={columns} />
                <Badge variant={priorityBadgeVariant(task.priority)}>
                  {task.priority} priority
                </Badge>
              </div>

              <div className="grid gap-4 rounded-2xl border border-dashboard-accent/15 bg-dashboard-accent-subtle/25 p-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dashboard-accent text-white shadow-sm">
                    <UserPen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Created by
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <UserAvatar user={task.createdBy} size="sm" />
                      <span className="text-sm font-medium text-text-primary">
                        {task.createdBy?.name ?? "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dashboard-accent text-white shadow-sm">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Assigned to
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <UserAvatar user={task.assignee} size="sm" />
                      <span className="text-sm font-medium text-text-primary">
                        {task.assignee?.name ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/15 text-info shadow-sm">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Due date
                    </p>
                    <p className="mt-1 text-sm font-medium text-text-primary">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>
                </div>
              </div>

              {task.description ? (
                <div className="rounded-xl border border-border bg-surface-raised/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text-secondary">
                    {task.description}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-dashboard-accent/15 pt-6">
                <TaskComments
                  taskId={taskId}
                  projectId={projectId}
                  embedded
                />
              </div>
            </>
          ) : null}
        </div>
      </Card>
    </section>
  );
}

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useMyTasks } from "@/features/tasks/hooks/useMyTasks";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { getTaskProjectColumns } from "@/lib/taskStatusConfig";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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

function groupTasksByProject(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    const projectId = task.projectId?.id ?? "unknown";
    const projectName = task.projectId?.name ?? "Unknown project";

    if (!groups.has(projectId)) {
      groups.set(projectId, { projectId, projectName, tasks: [] });
    }
    groups.get(projectId).tasks.push(task);
  }

  return Array.from(groups.values());
}

export function MyTasksPage() {
  useDashboardPageMeta({
    title: "My tasks",
    description: "Tasks assigned to you across all projects.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } = useMyTasks();
  const grouped = useMemo(() => groupTasksByProject(data ?? []), [data]);

  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load tasks."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No tasks assigned to you yet.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <Card key={group.projectId} className="overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <h2 className="font-medium text-text-primary">
                    {group.projectName}
                  </h2>
                  {group.projectId !== "unknown" ? (
                    <ButtonLink
                      to={`/member/projects/${group.projectId}/board`}
                      variant="primary"
                      size="sm"
                    >
                      Open board
                    </ButtonLink>
                  ) : null}
                </div>
                <ul className="divide-hover">
                  {group.tasks.map((task) => (
                    <li key={task._id}>
                      <Link
                        to={`/member/projects/${group.projectId}/board?task=${task._id}`}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
                      >
                        <div>
                          <p className="font-medium text-text-primary">
                            {task.title}
                          </p>
                          <p className="text-sm text-text-secondary">
                            Due {formatDate(task.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <TaskStatusBadge
                            status={task.status}
                            columns={getTaskProjectColumns(task)}
                          />
                          <Badge variant={priorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )
      ) : null}
    </>
  );
}

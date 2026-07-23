import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useDashboardData, sortTasksByUrgency } from "@/features/dashboard/hooks/useDashboardData";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { updateTaskStatus } from "@/lib/tasksApi";
import {
  DEFAULT_BOARD_COLUMNS,
  getDoneKey,
  getSortedColumns,
  getStatusLabel,
} from "@/lib/taskStatusConfig";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeVariant(status, columns) {
  const doneKey = getDoneKey(columns);
  if (status === doneKey) {
    return "success";
  }

  const sorted = getSortedColumns(columns);
  const index = sorted.findIndex((col) => col.key === status);
  if (index === 1) {
    return "default";
  }
  if (index === 2) {
    return "accent";
  }
  return "muted";
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

const statusSelectClassName =
  "rounded-full border-0 bg-transparent px-2.5 py-0.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

function StatusSelect({ task, columns, onStatusChange, isUpdating }) {
  const variant = statusBadgeVariant(task.status, columns);
  const sortedColumns = getSortedColumns(columns);

  return (
    <select
      value={task.status}
      disabled={isUpdating}
      onChange={(e) => onStatusChange(task._id, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        statusSelectClassName,
        variant === "success" && "bg-success/12 text-success",
        variant === "default" && "bg-primary-subtle text-primary",
        variant === "accent" && "bg-accent-subtle text-accent-foreground",
        variant === "muted" && "bg-surface text-text-secondary"
      )}
      aria-label={`Update status for ${task.title}`}
    >
      {sortedColumns.map((column) => (
        <option key={column.key} value={column.key}>
          {getStatusLabel(columns, column.key)}
        </option>
      ))}
    </select>
  );
}

export function AssignedTasksPreview() {
  const { tasks } = useDashboardData();
  const { data: projects } = useProjects();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["tasks", "mine", user?.organizationId, user?.id];

  const columnsByProjectId = new Map(
    (projects ?? []).map((project) => [
      project._id,
      project.columns?.length ? project.columns : DEFAULT_BOARD_COLUMNS,
    ])
  );

  const updateStatus = useMutation(
    withMutationToasts(
      {
        mutationFn: ({ taskId, status }) => updateTaskStatus(taskId, status),
        onMutate: async ({ taskId, status }) => {
          await queryClient.cancelQueries({ queryKey });
          const previous = queryClient.getQueryData(queryKey);
          queryClient.setQueryData(queryKey, (old) =>
            old?.map((task) => (task._id === taskId ? { ...task, status } : task))
          );
          return { previous };
        },
        onError: (_err, _vars, context) => {
          if (context?.previous) {
            queryClient.setQueryData(queryKey, context.previous);
          }
        },
        onSettled: () => {
          queryClient.invalidateQueries({ queryKey });
        },
      },
      { success: "Task status updated." }
    )
  );

  const previewTasks = sortTasksByUrgency(tasks).slice(0, 5);

  function handleStatusChange(taskId, status) {
    updateStatus.mutate({ taskId, status });
  }

  function columnsForTask(task) {
    const projectId = task.projectId?.id ?? task.projectId;
    return columnsByProjectId.get(projectId) ?? DEFAULT_BOARD_COLUMNS;
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-medium text-text-primary">Priority tasks</h2>
      </div>

      {previewTasks.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-sm text-text-secondary">No tasks assigned to you yet.</p>
        </div>
      ) : (
        <ul className="divide-hover">
          {previewTasks.map((task) => {
            const projectId = task.projectId?.id ?? task.projectId;
            const projectName = task.projectId?.name ?? "Unknown project";
            const columns = columnsForTask(task);

            return (
              <li key={task._id}>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/member/projects/${projectId}/tasks/${task._id}`}
                      className="font-medium text-text-primary hover:text-primary"
                    >
                      {task.title}
                    </Link>
                    <p className="text-sm text-text-secondary">
                      {projectName} · Due {formatDate(task.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={priorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                    <StatusSelect
                      task={task}
                      columns={columns}
                      onStatusChange={handleStatusChange}
                      isUpdating={updateStatus.isPending}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-border px-4 py-3">
        <ButtonLink to="/member/tasks" variant="outline" size="sm">
          View all tasks
        </ButtonLink>
      </div>
    </Card>
  );
}

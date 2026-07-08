import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useDashboardData, sortTasksByUrgency } from "@/features/dashboard/hooks/useDashboardData";
import { updateTaskStatus } from "@/lib/tasksApi";
import { TASK_STATUS_KEYS, TASK_STATUS_LABELS } from "@/lib/taskStatusConfig";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusBadgeVariant(status) {
  switch (status) {
    case "done":
      return "success";
    case "in-progress":
      return "default";
    case "review":
      return "accent";
    default:
      return "muted";
  }
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

function StatusSelect({ task, onStatusChange, isUpdating }) {
  const variant = statusBadgeVariant(task.status);

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
      {TASK_STATUS_KEYS.map((key) => (
        <option key={key} value={key}>
          {TASK_STATUS_LABELS[key]}
        </option>
      ))}
    </select>
  );
}

export function AssignedTasksPreview() {
  const { tasks } = useDashboardData();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["tasks", "mine", user?.organizationId, user?.id];

  const updateStatus = useMutation({
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
  });

  const previewTasks = sortTasksByUrgency(tasks).slice(0, 5);

  function handleStatusChange(taskId, status) {
    updateStatus.mutate({ taskId, status });
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
        <ul className="divide-y divide-border">
          {previewTasks.map((task) => {
            const projectId = task.projectId?.id ?? task.projectId;
            const projectName = task.projectId?.name ?? "Unknown project";

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

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { getProjectTasksPath } from "@/lib/projectPaths";
import { getTaskProjectColumns } from "@/lib/taskStatusConfig";
import { useAuth } from "@/hooks/useAuth";

const PREVIEW_LIMIT = 5;

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

function getProjectId(task) {
  return task.projectId?.id ?? task.projectId?._id ?? task.projectId;
}

function getProjectName(task) {
  return task.projectId?.name ?? task.projectName ?? "Unknown project";
}

export function TaskPreviewList({ tasks = [], limit = PREVIEW_LIMIT, role: roleOverride }) {
  const { user } = useAuth();
  const role = roleOverride ?? user?.role;
  const preview = tasks.slice(0, limit);

  if (preview.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {preview.map((task) => {
        const projectId = getProjectId(task);
        const columns = getTaskProjectColumns(task);

        return (
          <li key={task._id ?? task.id}>
            <Link
              to={getProjectTasksPath(role, projectId, task._id ?? task.id)}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">
                  {task.title}
                </p>
                <p className="text-sm text-text-secondary">
                  {getProjectName(task)} · Due {formatDate(task.dueDate)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {task.priority ? (
                  <Badge variant={priorityBadgeVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                ) : null}
                <TaskStatusBadge status={task.status} columns={columns} />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

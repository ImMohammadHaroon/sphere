import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
import { useTask } from "@/features/tasks/hooks/useTask";
import { useUpdateTask } from "@/features/tasks/hooks/useUpdateTask";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/apiClient";
import { useProject } from "@/features/projects/hooks/useProjects";
import {
  getSortedColumns,
  getStatusLabel,
  getTaskProjectColumns,
} from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { TaskComments } from "@/features/tasks/components/TaskComments";
import { TaskAttachments } from "@/features/tasks/components/TaskAttachments";
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

function TaskDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40" />
    </div>
  );
}

function AccessDeniedCard() {
  return (
    <Card className="p-8 text-center">
      <p className="text-lg font-medium text-text-primary">
        You don&apos;t have access to this task
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        You may not have permission to view or edit this task.
      </p>
    </Card>
  );
}

function NotFoundCard() {
  return (
    <Card className="p-8 text-center">
      <p className="text-lg font-medium text-text-primary">Task not found</p>
      <p className="mt-2 text-sm text-text-secondary">
        This task may have been deleted or the link is incorrect.
      </p>
    </Card>
  );
}

export function TeamMemberTaskDetailPage() {
  const { projectId: routeProjectId = "", taskId = "" } = useParams();
  const { user } = useAuth();

  const { data: task, isLoading, isError, error, refetch, isFetching } =
    useTask(taskId);

  const projectId =
    routeProjectId ||
    (typeof task?.projectId === "object"
      ? task.projectId?.id
      : task?.projectId) ||
    "";

  const { data: project } = useProject(projectId);

  const columns = useMemo(() => {
    if (project?.columns?.length > 0) {
      return project.columns;
    }
    return getTaskProjectColumns(task);
  }, [project?.columns, task]);

  const sortedColumns = getSortedColumns(columns);
  const defaultStatusKey = sortedColumns[0]?.key ?? "todo";

  const { data: members } = useProjectMembers(projectId);
  const updateTask = useUpdateTask(taskId, projectId);

  const taskAssigneeId = task?.assigneeId ?? task?.assignee?.id ?? null;
  const isAssignee = !!task && !!user?.id && taskAssigneeId === user.id;
  const canEditStatus = isAssignee;

  const [status, setStatus] = useState(defaultStatusKey);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!task) return;
    setStatus(task.status ?? defaultStatusKey);
    setSaveError("");
  }, [task, defaultStatusKey]);

  const isDirty = useMemo(() => {
    if (!task) return false;
    return status !== (task.status ?? defaultStatusKey);
  }, [task, status, defaultStatusKey]);

  const assigneeMember = members?.find((member) => member.id === task?.assigneeId);
  const assigneeUser = task?.assignee ?? assigneeMember ?? null;
  const assigneeName = assigneeUser?.name ?? null;
  const assigneeEmail = assigneeUser?.email ?? null;

  async function handleSave() {
    if (!task || !canEditStatus) return;

    setSaveError("");

    if (status === task.status) {
      return;
    }

    try {
      await updateTask.mutateAsync({ status });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to update task.");
    }
  }

  const accessDenied =
    isError && error instanceof ApiError && error.status === 403;
  const notFound =
    isError && error instanceof ApiError && error.status === 404;

  useDashboardPageMeta({
    title: task?.title ?? "Task detail",
    description: task
      ? `Task in project ${projectId}`
      : "View and update task details.",
  });

  return (
    <>
      <div className="mb-4">
        <ButtonLink to="/member" variant="ghost" size="sm">
          ← Back to dashboard
        </ButtonLink>
      </div>

      {isLoading ? <TaskDetailSkeleton /> : null}

      {accessDenied ? <AccessDeniedCard /> : null}
      {notFound ? <NotFoundCard /> : null}

      {isError && !accessDenied && !notFound ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load task."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && task ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-3">
                <h2 className="text-xl font-semibold text-text-primary">
                  {task.title}
                </h2>

                <div className="flex flex-wrap items-center gap-2">
                  {canEditStatus ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-surface-raised px-3 text-sm"
                      aria-label="Status"
                    >
                      {sortedColumns.map((column) => (
                        <option key={column.key} value={column.key}>
                          {getStatusLabel(columns, column.key)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <TaskStatusBadge status={task.status} columns={columns} />
                  )}

                  <Badge variant={priorityBadgeVariant(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </div>

              {canEditStatus ? (
                <Button
                  type="button"
                  onClick={handleSave}
                  isLoading={updateTask.isPending}
                  disabled={!isDirty}
                >
                  Save changes
                </Button>
              ) : null}
            </div>

            {saveError ? (
              <Alert variant="error" className="mt-4">
                {saveError}
              </Alert>
            ) : null}
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {task.description || "No description."}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Assignee</Label>
                <div className="flex items-center gap-3">
                  <UserAvatar user={assigneeUser} size="md" />
                  <div>
                    <span className="text-sm text-text-primary">
                      {assigneeName ?? "Unassigned"}
                    </span>
                    {assigneeEmail ? (
                      <p className="text-xs text-text-muted">{assigneeEmail}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                <p className="text-sm text-text-primary">
                  {formatDate(task.dueDate)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-text-primary">
                  {formatDate(task.createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Last updated</Label>
                <p className="text-sm text-text-primary">
                  {formatDate(task.updatedAt)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <TaskAttachments
              taskId={taskId}
              projectId={projectId}
              canUpload={isAssignee}
            />
          </Card>

          <TaskComments taskId={taskId} projectId={projectId} />
        </div>
      ) : null}
    </>
  );
}

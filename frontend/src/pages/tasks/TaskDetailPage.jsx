import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
import { useTask } from "@/features/tasks/hooks/useTask";
import { useUpdateTask } from "@/features/tasks/hooks/useUpdateTask";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/apiClient";
import {
  dateInputToIso,
  toDateInputValue,
} from "@/lib/dateFormHelpers";
import { useProject } from "@/features/projects/hooks/useProjects";
import {
  DEFAULT_BOARD_COLUMNS,
  getSortedColumns,
  getStatusLabel,
} from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { TaskComments } from "@/features/tasks/components/TaskComments";
import { TaskAttachments } from "@/features/tasks/components/TaskAttachments";
import { RecordTaskButton } from "@/features/task-recording/components/RecordTaskButton";
import { formatTimestamp } from "@/lib/dateTimeUtils";

const selectClassName =
  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

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

function getBackPath(role, projectId) {
  if (role === "team_member") {
    return "/member";
  }
  if (role === "org_admin") {
    return `/admin/projects/${projectId}?tab=tasks`;
  }
  return `/dashboard/projects/${projectId}?tab=tasks`;
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

export function TaskDetailPage() {
  const { projectId: routeProjectId = "", taskId = "" } = useParams();
  const { user } = useAuth();
  const role = user?.role ?? "project_manager";

  const { data: task, isLoading, isError, error, refetch, isFetching } =
    useTask(taskId);

  const projectId =
    routeProjectId ||
    (typeof task?.projectId === "object"
      ? task.projectId?.id
      : task?.projectId) ||
    "";

  const { data: project } = useProject(projectId);
  const columns =
    project?.columns?.length > 0 ? project.columns : DEFAULT_BOARD_COLUMNS;
  const sortedColumns = getSortedColumns(columns);
  const defaultStatusKey = sortedColumns[0]?.key ?? "todo";

  const { data: members } = useProjectMembers(projectId);
  const updateTask = useUpdateTask(taskId, projectId);

  const isElevated = role === "org_admin" || role === "project_manager";
  const taskAssigneeId = task?.assigneeId ?? task?.assignee?.id ?? null;
  const isAssignee = !!task && !!user?.id && taskAssigneeId === user.id;
  const canEditAll = isElevated;
  const canEditStatus = isElevated || role === "team_member";
  const canEditDescription = isElevated;
  const canSave = canEditAll || canEditStatus;
  const canUploadAttachments = isElevated || isAssignee;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(defaultStatusKey);
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setStatus(task.status ?? defaultStatusKey);
    setAssigneeId(task.assigneeId ?? "");
    setPriority(task.priority ?? "medium");
    setDueDate(toDateInputValue(task.dueDate));
    setSaveError("");
  }, [task]);

  const isDirty = useMemo(() => {
    if (!task) return false;
    return (
      title !== (task.title ?? "") ||
      description !== (task.description ?? "") ||
      status !== (task.status ?? defaultStatusKey) ||
      (assigneeId || "") !== (task.assigneeId ?? "") ||
      priority !== (task.priority ?? "medium") ||
      dueDate !== toDateInputValue(task.dueDate)
    );
  }, [task, title, description, status, assigneeId, priority, dueDate, defaultStatusKey]);

  const assigneeMember = members?.find((member) => member.id === task?.assigneeId);
  const assigneeUser = task?.assignee ?? assigneeMember ?? null;
  const assigneeName = assigneeUser?.name ?? null;
  const assigneeEmail = assigneeUser?.email ?? null;
  const creatorUser = task?.createdBy ?? null;
  const creatorName = creatorUser?.name ?? null;
  const creatorEmail = creatorUser?.email ?? null;

  async function handleSave() {
    if (!task || !canSave) return;

    setSaveError("");

    const payload = {};
    if (canEditAll) {
      if (title.trim() !== task.title) payload.title = title.trim();
      if (description !== (task.description ?? "")) {
        payload.description = description;
      }
      if (status !== task.status) payload.status = status;
      const nextAssignee = assigneeId || null;
      if (nextAssignee !== (task.assigneeId ?? null)) {
        payload.assigneeId = nextAssignee;
      }
      if (priority !== task.priority) payload.priority = priority;
      const nextDue = dateInputToIso(dueDate);
      const prevDue = task.dueDate ?? null;
      if (nextDue !== prevDue) payload.dueDate = nextDue;
    } else if (status !== task.status) {
      payload.status = status;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    if (canEditAll && !title.trim()) {
      setSaveError("Title is required.");
      return;
    }

    try {
      await updateTask.mutateAsync(payload);
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
    showBack: true,
    backLabel: "Back to project",
    backTo: getBackPath(role, projectId),
  });

  return (
    <>
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
                {canEditAll ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-xl font-semibold"
                    aria-label="Task title"
                  />
                ) : (
                  <h2 className="text-xl font-semibold text-text-primary">
                    {task.title}
                  </h2>
                )}

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

                  {canEditAll ? (
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="h-9 rounded-lg border border-border bg-surface-raised px-3 text-sm"
                      aria-label="Priority"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <Badge variant={priorityBadgeVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canSave ? (
                  <Button
                    type="button"
                    onClick={handleSave}
                    isLoading={updateTask.isPending}
                    disabled={!isDirty}
                  >
                    Save changes
                  </Button>
                ) : null}

                {canUploadAttachments ? (
                  <RecordTaskButton
                    projectId={projectId}
                    taskId={taskId}
                  />
                ) : null}
              </div>
            </div>

            {saveError ? <Alert variant="error" className="mt-4">{saveError}</Alert> : null}
          </Card>

          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Description</Label>
              {canEditDescription ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="No description"
                  className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              ) : (
                <p className="text-sm text-text-secondary whitespace-pre-wrap">
                  {task.description || "No description."}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Created by</Label>
                <div className="flex items-center gap-3">
                  <UserAvatar user={creatorUser} size="md" />
                  <div>
                    <span className="text-sm text-text-primary">
                      {creatorName ?? "Unknown"}
                    </span>
                    {creatorEmail ? (
                      <p className="text-xs text-text-muted">{creatorEmail}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assigned to</Label>
                {canEditAll ? (
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Unassigned</option>
                    {(members ?? []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                ) : (
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
                )}
              </div>

              <div className="space-y-2">
                <Label>Due date</Label>
                {canEditAll ? (
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-text-primary">
                    {formatDate(task.dueDate)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Created</Label>
                <p className="text-sm text-text-primary">
                  {formatTimestamp(task.createdAt)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Last updated</Label>
                <p className="text-sm text-text-primary">
                  {formatTimestamp(task.updatedAt)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <TaskAttachments
              taskId={taskId}
              projectId={projectId}
              canUpload={canUploadAttachments}
            />
          </Card>

          <TaskComments taskId={taskId} projectId={projectId} />
        </div>
      ) : null}
    </>
  );
}
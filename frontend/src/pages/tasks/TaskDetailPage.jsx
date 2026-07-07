import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { TeamMemberLayout } from "@/components/layout/TeamMemberLayout";
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
import { TASK_STATUS_KEYS, TASK_STATUS_LABELS } from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";

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

function memberInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
    return `/admin/projects/${projectId}`;
  }
  return `/dashboard/projects/${projectId}`;
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
  const { projectId = "", taskId = "" } = useParams();
  const { user } = useAuth();
  const role = user?.role ?? "project_manager";

  const Layout =
    role === "team_member"
      ? TeamMemberLayout
      : role === "org_admin"
        ? OrgAdminLayout
        : ProjectManagerLayout;

  const { data: task, isLoading, isError, error, refetch, isFetching } =
    useTask(taskId);
  const { data: members } = useProjectMembers(projectId);
  const updateTask = useUpdateTask(taskId, projectId);

  const isElevated = role === "org_admin" || role === "project_manager";
  const isAssignee = !!task && task.assigneeId === user?.id;
  const canEditAll = isElevated;
  const canEditStatus = isElevated || isAssignee;
  const canEditDescription = isElevated || isAssignee;
  const canSave = canEditAll || canEditStatus;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!task) return;
    setTitle(task.title ?? "");
    setDescription(task.description ?? "");
    setStatus(task.status ?? "todo");
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
      status !== (task.status ?? "todo") ||
      (assigneeId || "") !== (task.assigneeId ?? "") ||
      priority !== (task.priority ?? "medium") ||
      dueDate !== toDateInputValue(task.dueDate)
    );
  }, [task, title, description, status, assigneeId, priority, dueDate]);

  const assigneeName =
    task?.assignee?.name ??
    members?.find((member) => member.id === task?.assigneeId)?.name ??
    null;

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
    } else {
      if (status !== task.status) payload.status = status;
      if (description !== (task.description ?? "")) {
        payload.description = description;
      }
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

  return (
    <Layout
      title={task?.title ?? "Task detail"}
      description={
        task
          ? `Task in project ${projectId}`
          : "View and update task details."
      }
    >
      <div className="mb-4">
        <ButtonLink to={getBackPath(role, projectId)} variant="ghost" size="sm">
          ← Back to project
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
                      {TASK_STATUS_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {TASK_STATUS_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <TaskStatusBadge status={task.status} />
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
                <Label>Assignee</Label>
                {canEditAll ? (
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Unassigned</option>
                    {(members ?? []).map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-medium text-primary">
                      {memberInitials(assigneeName)}
                    </div>
                    <span className="text-sm text-text-primary">
                      {assigneeName ?? "Unassigned"}
                    </span>
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
        </div>
      ) : null}
    </Layout>
  );
}

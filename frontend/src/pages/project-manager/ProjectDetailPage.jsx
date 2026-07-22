import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddMember,
  useArchiveProject,
  useProject,
  useRemoveMember,
  useUpdateProject,
} from "@/features/projects/hooks/useProjects";
import { useOrgUsers } from "@/features/org/hooks/useOrgUsers";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { useProjectTasks } from "@/features/tasks/hooks/useProjectTasks";
import {
  dateInputToIso,
  toDateInputValue,
} from "@/lib/dateFormHelpers";
import { DEFAULT_BOARD_COLUMNS } from "@/lib/taskStatusConfig";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";

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

function formatRoleLabel(role) {
  const labels = {
    org_admin: "Organization Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
    client: "Client",
  };
  return labels[role] ?? role?.replaceAll("_", " ") ?? "";
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

function getTaskDetailPath(role, projectId, taskId) {
  const base = role === "org_admin" ? "/admin" : "/dashboard";
  return `${base}/projects/${projectId}/tasks/${taskId}`;
}

function AddMemberDialog({ open, onOpenChange, project, onAdd, isLoading }) {
  const { data: orgUsers, isLoading: usersLoading } = useOrgUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const existingIds = useMemo(() => {
    const ids = new Set([project?.ownerId]);
    for (const member of project?.members ?? []) {
      ids.add(typeof member === "string" ? member : member.id);
    }
    return ids;
  }, [project]);

  const availableUsers = useMemo(
    () => (orgUsers ?? []).filter((user) => !existingIds.has(user.id)),
    [orgUsers, existingIds]
  );

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setSelectedUserId("");
      setError("");
    }
    onOpenChange(nextOpen);
  }

  async function handleAdd() {
    if (!selectedUserId) {
      setError("Select a team member to add.");
      return;
    }

    setError("");
    try {
      await onAdd(selectedUserId);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Choose someone from your organization to add to this project.
          </DialogDescription>
        </DialogHeader>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="member-select">Team member</Label>
          <select
            id="member-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={usersLoading || availableUsers.length === 0}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">
              {usersLoading
                ? "Loading users..."
                : availableUsers.length === 0
                  ? "No available users"
                  : "Select a user"}
            </option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
                {user.role ? ` ${formatRoleLabel(user.role)}` : ""}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            isLoading={isLoading}
            disabled={availableUsers.length === 0}
          >
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOrgAdmin = user?.role === "org_admin";
  const projectsPath = isOrgAdmin ? "/admin/projects" : "/dashboard";
  const { data: project, isLoading, isError, error, refetch, isFetching } =
    useProject(id);
  const updateProject = useUpdateProject();
  const archiveProject = useArchiveProject();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();
  const { data: tasks, isLoading: tasksLoading } = useProjectTasks(id);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editError, setEditError] = useState("");
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [actionError, setActionError] = useState("");

  useDashboardPageMeta({
    title: project?.name ?? "Project",
    description: project?.description || "Project details and team.",
  });

  function startEditing() {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditDueDate(toDateInputValue(project.dueDate));
    setEditError("");
    setIsEditing(true);
  }

  async function handleSave() {
    setEditError("");
    try {
      await updateProject.mutateAsync({
        id,
        data: {
          name: editName.trim(),
          description: editDescription.trim(),
          dueDate: dateInputToIso(editDueDate),
        },
      });
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update project.");
    }
  }

  async function handleAddMember(userId) {
    await addMember.mutateAsync({ id, userId });
  }

  async function handleRemoveMemberConfirm() {
    if (!removeMemberTarget) return;

    setActionError("");
    try {
      await removeMember.mutateAsync({ id, userId: removeMemberTarget.id });
      setRemoveMemberTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove member."
      );
      throw err;
    }
  }

  async function handleArchive() {
    setActionError("");
    try {
      await archiveProject.mutateAsync(id);
      navigate(projectsPath);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to archive project."
      );
      throw err;
    }
  }

  return (
    <>
      <div className="mb-4">
        <ButtonLink to={projectsPath} variant="ghost" size="sm">
          ← Back to projects
        </ButtonLink>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load project."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && project ? (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="max-w-md text-lg font-semibold"
                    />
                  ) : (
                    <h2 className="text-xl font-semibold text-text-primary">
                      {project.name}
                    </h2>
                  )}
                  <Badge variant={project.status === "active" ? "success" : "muted"}>
                    {project.status}
                  </Badge>
                </div>

                {isEditing ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full max-w-2xl rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                ) : (
                  <p className="max-w-2xl text-text-secondary">
                    {project.description || "No description."}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span>Start: {formatDate(project.startDate)}</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="edit-due" className="sr-only">
                        Due date
                      </Label>
                      <Input
                        id="edit-due"
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="w-auto"
                      />
                    </div>
                  ) : (
                    <span>Due: {formatDate(project.dueDate)}</span>
                  )}
                </div>

                {editError ? <Alert variant="error">{editError}</Alert> : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      isLoading={updateProject.isPending}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="outline" onClick={startEditing}>
                      Edit
                    </Button>
                    {!isOrgAdmin ? (
                      <>
                        <ButtonLink to={`/dashboard/projects/${id}/board`}>
                          Open board
                        </ButtonLink>
                        <ButtonLink to={`/dashboard/projects/${id}/calendar`}>
                          Open calendar
                        </ButtonLink>
                        <ButtonLink to={`/dashboard/projects/${id}/milestones`}>
                          Open milestones
                        </ButtonLink>
                        <ButtonLink to={`/dashboard/projects/${id}/reports`}>
                          Open reports
                        </ButtonLink>
                      </>
                    ) : null}
                    {project.status === "active" ? (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => setArchiveDialogOpen(true)}
                      >
                        Archive
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </Card>

          {actionError ? <Alert variant="error">{actionError}</Alert> : null}

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">Tasks</h3>
              <Button type="button" size="sm" onClick={() => setCreateTaskOpen(true)}>
                Create task
              </Button>
            </div>

            {tasksLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : (tasks ?? []).length === 0 ? (
              <p className="text-sm text-text-secondary">
                No tasks yet. Create one to get started.
              </p>
            ) : (
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(tasks ?? []).map((task) => (
                      <TableRow key={task._id}>
                        <TableCell>
                          <Link
                            to={getTaskDetailPath(user?.role, id, task._id)}
                            className="font-medium text-primary hover:underline"
                          >
                            {task.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {task.assignee?.name ?? "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <TaskStatusBadge
                            status={task.status}
                            columns={project?.columns?.length ? project.columns : DEFAULT_BOARD_COLUMNS}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={priorityBadgeVariant(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            )}
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">Members</h3>
              <Button type="button" size="sm" onClick={() => setMemberDialogOpen(true)}>
                Add member
              </Button>
            </div>

            <ul className="space-y-3">
              {(project.members ?? []).map((member) => {
                const memberId = typeof member === "string" ? member : member.id;
                const isOwner = memberId === project.ownerId;
                const name = typeof member === "string" ? memberId : member.name;
                const role = typeof member === "string" ? "" : member.role;

                return (
                  <li
                    key={memberId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-subtle text-sm font-medium text-primary">
                        {memberInitials(name)}
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">
                          {name}
                          {isOwner ? (
                            <span className="ml-2 text-xs text-text-muted">
                              (owner)
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {role ? (
                        <Badge variant="muted">{formatRoleLabel(role)}</Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isOwner || removeMember.isPending}
                        onClick={() =>
                          setRemoveMemberTarget({ id: memberId, name })
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      ) : null}

      <AddMemberDialog
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
        project={project}
        onAdd={handleAddMember}
        isLoading={addMember.isPending}
      />

      <CreateTaskModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        projectId={id}
      />

      <ConfirmDialog
        open={Boolean(removeMemberTarget)}
        onOpenChange={(open) => !open && setRemoveMemberTarget(null)}
        title="Remove member"
        description={
          removeMemberTarget
            ? `Remove ${removeMemberTarget.name} from this project? They will lose access to project tasks and updates.`
            : null
        }
        confirmLabel="Remove member"
        onConfirm={handleRemoveMemberConfirm}
        isLoading={removeMember.isPending}
      />

      <ConfirmDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        title="Archive project"
        description={
          project
            ? `Archive "${project.name}"? The project will be hidden from active lists but not permanently deleted.`
            : null
        }
        confirmLabel="Archive project"
        onConfirm={handleArchive}
        isLoading={archiveProject.isPending}
      />
    </>
  );
}

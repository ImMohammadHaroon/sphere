import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import {
  useAddMember,
  useProject,
  useRemoveMember,
  useUpdateProject,
} from "@/features/projects/hooks/useProjects";
import { AddMemberDialog } from "@/features/projects/components/AddMemberDialog";
import { DeleteProjectDialog } from "@/features/projects/components/DeleteProjectDialog";
import { ProjectWorkspace } from "@/features/projects/components/ProjectWorkspace";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { RecordTaskButton } from "@/features/task-recording/components/RecordTaskButton";
import {
  dateInputToIso,
  toDateInputValue,
} from "@/lib/dateFormHelpers";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError, error, refetch, isFetching } =
    useProject(id);
  const updateProject = useUpdateProject();
  const addMember = useAddMember();
  const removeMember = useRemoveMember();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editError, setEditError] = useState("");
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [actionError, setActionError] = useState("");

  useDashboardPageMeta({
    title: project?.name ?? "Project",
    description: project?.description || "Project details and team.",
    showBack: true,
    backLabel: "Back to projects",
    backTo: "/dashboard",
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
    navigate("/dashboard");
  }

  return (
    <>
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
                    <ButtonLink
                      to={`/dashboard/projects/${id}/calendar`}
                      variant="info"
                    >
                      Open calendar
                    </ButtonLink>
                    <ButtonLink
                      to={`/dashboard/projects/${id}/reports`}
                      variant="accent"
                    >
                      Open reports
                    </ButtonLink>
                    {project.status === "active" ? (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => setDeleteDialogOpen(true)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </Card>

          {actionError ? <Alert variant="error">{actionError}</Alert> : null}

          <ProjectWorkspace
            projectId={id}
            role="project_manager"
            canManageMilestones
            toolbar={
              <div className="flex flex-wrap justify-end gap-2">
                <RecordTaskButton projectId={id} />
                <Button type="button" variant="secondary" onClick={() => setCreateTaskOpen(true)}>
                  Create task
                </Button>
              </div>
            }
          />

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-text-primary">Members</h3>
              <Button type="button" size="sm" variant="primary" onClick={() => setMemberDialogOpen(true)}>
                Add member
              </Button>
            </div>

            <ul className="space-y-3">
              {(project.members ?? []).map((member) => {
                const memberId = typeof member === "string" ? member : member.id;
                const isOwner = memberId === project.ownerId;
                const name = typeof member === "string" ? memberId : member.name;
                const role = typeof member === "string" ? "" : member.role;
                const memberUser = typeof member === "string" ? { id: memberId, name } : member;

                return (
                  <li
                    key={memberId}
                    className="container-item flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={memberUser} size="md" />
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

      <DeleteProjectDialog
        project={project}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleArchive}
      />
    </>
  );
}

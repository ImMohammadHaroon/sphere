import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { AddMemberDialog } from "@/features/projects/components/AddMemberDialog";
import { DeleteProjectDialog } from "@/features/projects/components/DeleteProjectDialog";
import { ProjectWorkspace } from "@/features/projects/components/ProjectWorkspace";
import { useAddMember, useProject } from "@/features/projects/hooks/useProjects";
import { CreateTaskModal } from "@/features/tasks/components/CreateTaskModal";
import { RecordTaskButton } from "@/features/task-recording/components/RecordTaskButton";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function OrgAdminProjectPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const projectId = id ?? "";
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: project, isLoading, isError, error, refetch, isFetching } =
    useProject(projectId);
  const addMember = useAddMember();

  useDashboardPageMeta({
    title: project?.name ?? "Project",
    description: project?.description || "Tasks, milestones, and project activity.",
    showBack: true,
    backLabel: "Back to projects",
    backTo: "/admin/projects",
  });

  async function handleAddMember(userId) {
    await addMember.mutateAsync({ id: projectId, userId });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[24rem] w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load project."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <ProjectWorkspace
        projectId={projectId}
        role="org_admin"
        canManageMilestones
        toolbar={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RecordTaskButton projectId={projectId} />
            <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(true)}>
              Add member
            </Button>
            <ButtonLink
              to={`/admin/projects/${projectId}/calendar`}
              variant="info"
            >
              Calendar
            </ButtonLink>
            <Button type="button" variant="info" onClick={() => setCreateTaskOpen(true)}>
              Create task
            </Button>
            {project?.status === "active" ? (
              <Button
                type="button"
                variant="danger"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            ) : null}
          </div>
        }
      />

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
        projectId={projectId}
      />

      <DeleteProjectDialog
        project={project}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={() => navigate("/admin/projects")}
      />
    </>
  );
}

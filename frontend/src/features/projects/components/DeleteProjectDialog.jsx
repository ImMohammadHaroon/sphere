import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useArchiveProject } from "@/features/projects/hooks/useProjects";

function getProjectId(project) {
  return project?._id ?? project?.id ?? null;
}

export function DeleteProjectDialog({
  project,
  open,
  onOpenChange,
  onSuccess,
}) {
  const archiveProject = useArchiveProject();
  const projectId = getProjectId(project);

  async function handleConfirm() {
    if (!projectId) return;
    await archiveProject.mutateAsync(projectId);
    onSuccess?.();
  }

  return (
    <ConfirmDialog
      open={open && Boolean(projectId)}
      onOpenChange={onOpenChange}
      title="Delete project"
      description={
        project
          ? `Delete "${project.name}"? The project will be archived and hidden from active lists.`
          : null
      }
      confirmLabel="Delete project"
      onConfirm={handleConfirm}
      isLoading={archiveProject.isPending}
    />
  );
}

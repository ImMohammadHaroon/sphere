import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { useProjects } from "@/features/projects/hooks/useProjects";

const selectClassName =
  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

export function ProjectSelectStep({
  projectId: initialProjectId,
  onProjectChange,
}) {
  const {
    data: projects = [],
    isLoading,
    isError,
  } = useProjects();
  const [projectId, setProjectId] = useState(initialProjectId ?? "");

  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (!initialProjectId && projects.length === 1 && !projectId) {
      const onlyProjectId = projects[0]._id;
      setProjectId(onlyProjectId);
      onProjectChange(onlyProjectId);
    }
  }, [initialProjectId, projects, projectId, onProjectChange]);

  function handleChange(nextProjectId) {
    setProjectId(nextProjectId);
    onProjectChange(nextProjectId);
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (isError) {
    return <Alert variant="error">Failed to load projects.</Alert>;
  }

  if (projects.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        No projects available. Create a project before recording.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="record-project">Project</Label>
      <select
        id="record-project"
        value={projectId}
        onChange={(event) => handleChange(event.target.value)}
        className={selectClassName}
      >
        <option value="">Select a project</option>
        {projects.map((project) => (
          <option key={project._id} value={project._id}>
            {project.name}
          </option>
        ))}
      </select>
    </div>
  );
}

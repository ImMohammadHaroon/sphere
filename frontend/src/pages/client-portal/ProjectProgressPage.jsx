import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ClientProjectBoard } from "@/features/client-portal/ClientProjectBoard";
import { useClientProjects } from "@/features/client-portal/hooks/useClientProjects";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProjectProgressDetail({ project }) {
  const dueDate = formatDate(project.dueDate);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-text-primary">{project.name}</h2>
        {project.description ? (
          <p className="text-text-secondary">{project.description}</p>
        ) : null}
        {dueDate ? (
          <p className="text-sm text-text-secondary">Due {dueDate}</p>
        ) : null}
      </div>

      <ClientProjectBoard projectId={project._id} />
    </div>
  );
}

function ProjectProgressContent() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");

  useDashboardPageMeta({
    title: projectId ? "Project board" : "Board",
    description: projectId
      ? "Full Kanban board for your project."
      : "Pick a project to view its full Kanban board.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/portal/progress" : undefined,
  });

  const {
    projects,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClientProjects();

  const project = useMemo(() => {
    if (!projectId) return null;
    return projects.find((item) => item._id === projectId) ?? null;
  }, [projectId, projects]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-hidden">
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
          {error instanceof Error ? error.message : "Failed to load projects."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!projectId) {
    return (
      <ProjectPicker
        projects={projects}
        getProjectHref={(item) => `/portal/progress?project=${item._id}`}
        actionLabel="Open board"
        emptyTitle="No projects have been shared with you yet"
        renderSubtitle={(item) => (
          <p className="mt-1 text-sm text-text-secondary">
            {item.doneTasks} of {item.totalTasks} tasks complete{" "}
            {item.percentComplete}%
          </p>
        )}
      />
    );
  }

  if (!project) {
    return (
      <Card className="p-8 text-center">
        <p className="text-text-secondary">This project is not available.</p>
        <Link
          to="/portal/progress"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Back to all projects
        </Link>
      </Card>
    );
  }

  return <ProjectProgressDetail project={project} />;
}

export function ProjectProgressPage() {
  return <ProjectProgressContent />;
}

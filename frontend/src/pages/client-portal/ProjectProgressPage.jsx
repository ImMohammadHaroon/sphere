import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { ClientProgressBar } from "@/features/client-portal/ClientProgressBar";
import { useClientProjects } from "@/features/client-portal/hooks/useClientProjects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DEFAULT_BOARD_COLUMNS,
  getSortedColumns,
  getStatusColor,
} from "@/lib/taskStatusConfig";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ProjectPicker({ projects }) {
  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-text-secondary">
          No projects have been shared with you yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <ul className="divide-y divide-border">
        {projects.map((project) => (
          <li key={project._id}>
            <Link
              to={`/portal/progress?project=${project._id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface"
            >
              <div>
                <p className="font-medium text-text-primary">{project.name}</p>
                <p className="text-sm text-text-secondary">
                  {project.doneTasks} of {project.totalTasks} tasks complete{" "}
                  {project.percentComplete}%
                </p>
              </div>
              <span className="text-sm font-medium text-primary">View</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ColumnBreakdown({ project }) {
  const columns = getSortedColumns(
    project.columns?.length ? project.columns : DEFAULT_BOARD_COLUMNS
  );
  const tasks = project.tasks ?? [];

  const columnCounts = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      count: tasks.filter((task) => task.status === column.key).length,
    }));
  }, [columns, tasks]);

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-medium text-text-primary">Tasks by status</h2>
      </div>
      <ul className="divide-y divide-border">
        {columnCounts.map((column) => (
          <li
            key={column.key}
            className="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: getStatusColor(columns, column.key) }}
                aria-hidden
              />
              <span className="text-text-primary">{column.name}</span>
            </div>
            <span className="text-sm text-text-secondary">
              {column.count} {column.count === 1 ? "task" : "tasks"}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ProjectProgressDetail({ project }) {
  const dueDate = formatDate(project.dueDate);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          to="/portal/progress"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← All projects
        </Link>
        <h2 className="text-xl font-semibold text-text-primary">{project.name}</h2>
        {project.description ? (
          <p className="text-text-secondary">{project.description}</p>
        ) : null}
        {dueDate ? (
          <p className="text-sm text-text-secondary">Due {dueDate}</p>
        ) : null}
      </div>

      <Card className="space-y-3">
        <ClientProgressBar value={project.percentComplete} />
        <p className="text-sm text-text-secondary">
          {project.doneTasks} of {project.totalTasks} tasks complete{" "}
          {project.percentComplete}%
        </p>
      </Card>

      <ColumnBreakdown project={project} />
    </div>
  );
}

function ProjectProgressContent() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const {
    projects,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClientProjects();

  const selectedProject = useMemo(() => {
    if (!projectId) return null;
    return projects.find((project) => project._id === projectId) ?? null;
  }, [projectId, projects]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
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
    return <ProjectPicker projects={projects} />;
  }

  if (!selectedProject) {
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

  return <ProjectProgressDetail project={selectedProject} />;
}

export function ProjectProgressPage() {
  return (
    <ClientPortalLayout
      title="Project progress"
      description="Read-only view of status, completion, and timeline for your projects."
    >
      <ProjectProgressContent />
    </ClientPortalLayout>
  );
}

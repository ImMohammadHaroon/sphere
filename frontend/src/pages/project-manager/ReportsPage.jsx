import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { BurndownChart } from "@/features/reports/BurndownChart";
import { VelocityChart } from "@/features/reports/VelocityChart";
import { WorkloadChart } from "@/features/reports/WorkloadChart";
import {
  useBurndownReport,
  useVelocityReport,
  useWorkloadReport,
} from "@/features/reports/hooks/useProjectReports";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-80 w-full" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

export function ProjectManagerReportsPage() {
  const navigate = useNavigate();
  const { id, projectId: routeProjectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectId =
    routeProjectId || id || searchParams.get("projectId") || "";

  const { data: projects, isLoading: projectsLoading } = useProjects();

  const burndown = useBurndownReport(projectId);
  const velocity = useVelocityReport(projectId);
  const workload = useWorkloadReport(projectId);

  const isLoading =
    !!projectId &&
    (burndown.isLoading || velocity.isLoading || workload.isLoading);
  const isError =
    !!projectId && (burndown.isError || velocity.isError || workload.isError);
  const error = burndown.error || velocity.error || workload.error;
  const isFetching =
    burndown.isFetching || velocity.isFetching || workload.isFetching;

  function handleProjectChange(nextId) {
    if (!nextId) {
      navigate("/dashboard/reports");
      return;
    }
    navigate(`/dashboard/projects/${nextId}/reports`);
  }

  function refetchAll() {
    return Promise.all([
      burndown.refetch(),
      velocity.refetch(),
      workload.refetch(),
    ]);
  }

  return (
    <ProjectManagerLayout
      title="Reports"
      description="Progress, velocity, and workload across your projects."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {projectId ? (
          <ButtonLink
            to={`/dashboard/projects/${projectId}`}
            variant="ghost"
            size="sm"
          >
            ← Back to project
          </ButtonLink>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="shrink-0">Project</span>
          <select
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            disabled={projectsLoading}
            className="h-10 min-w-[12rem] rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">
              {projectsLoading ? "Loading…" : "Select a project"}
            </option>
            {(projects ?? []).map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!projectId ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">
            Select a project to view burndown, velocity, and workload.
          </p>
        </Card>
      ) : null}

      {isLoading ? <ReportsSkeleton /> : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : "Failed to load reports."}
          </p>
          <Button
            className="mt-4"
            onClick={() => refetchAll()}
            isLoading={isFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {projectId && !isLoading && !isError ? (
        <div className="space-y-4">
          <BurndownChart
            series={burndown.data?.series}
            totalScope={burndown.data?.totalScope}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <VelocityChart series={velocity.data?.series} />
            <WorkloadChart workload={workload.data?.workload} />
          </div>
        </div>
      ) : null}
    </ProjectManagerLayout>
  );
}

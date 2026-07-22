import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { BurndownChart } from "@/features/reports/BurndownChart";
import { VelocityChart } from "@/features/reports/VelocityChart";
import { WorkloadChart } from "@/features/reports/WorkloadChart";
import {
  useBurndownReport,
  useVelocityReport,
  useWorkloadReport,
} from "@/features/reports/hooks/useProjectReports";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { Button } from "@/components/ui/Button";
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

  useDashboardPageMeta({
    title: "Reports",
    description: "Progress, velocity, and workload across your projects.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/dashboard/reports" : undefined,
  });

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
    <>
      {projectsLoading && !projectId ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : null}

      {!projectsLoading && !projectId ? (
        <ProjectPicker
          projects={projects ?? []}
          getProjectHref={(project) => `/dashboard/projects/${project._id}/reports`}
          actionLabel="Open report"
          emptyTitle="No projects yet"
          emptyDescription="Create a project to view burndown, velocity, and workload."
        />
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
    </>
  );
}

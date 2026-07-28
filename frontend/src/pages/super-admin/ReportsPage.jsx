import { Link, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { BurndownChart } from "@/features/reports/BurndownChart";
import { OrgGrowthChart } from "@/features/reports/OrgGrowthChart";
import { ReportsSkeleton } from "@/features/reports/ReportsSkeleton";
import { UsersByRoleBreakdown } from "@/features/reports/UsersByRoleBreakdown";
import { VelocityChart } from "@/features/reports/VelocityChart";
import { WorkloadChart } from "@/features/reports/WorkloadChart";
import { usePlatformReportsOverview } from "@/features/reports/hooks/useOverviewReports";
import {
  usePlatformBurndownReport,
  usePlatformVelocityReport,
  usePlatformWorkloadReport,
} from "@/features/reports/hooks/usePlatformReports";
import { usePlatformProjects } from "@/features/projects/hooks/usePlatformProjects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";

function formatPercent(rate) {
  if (rate == null || Number.isNaN(Number(rate))) {
    return "—";
  }
  return `${Math.round(Number(rate) * 100)}%`;
}

function PercentMetricCard({ label, value }) {
  return (
    <Card className="bg-dashboard-accent-subtle p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-primary sm:text-3xl">
        {formatPercent(value)}
      </p>
    </Card>
  );
}

export function SuperAdminReportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  useDashboardPageMeta({
    title: "Reports",
    description: "Platform-wide analytics and growth.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformReportsOverview();
  const { data: projectsData, isLoading: projectsLoading } =
    usePlatformProjects();

  const projects = projectsData?.projects ?? [];

  const burndown = usePlatformBurndownReport(projectId);
  const velocity = usePlatformVelocityReport(projectId);
  const workload = usePlatformWorkloadReport(projectId);

  const selectedProject = projects.find((project) => project._id === projectId);

  const chartsLoading =
    !!projectId &&
    (burndown.isLoading || velocity.isLoading || workload.isLoading);
  const chartsError =
    !!projectId && (burndown.isError || velocity.isError || workload.isError);
  const chartsFetchError =
    burndown.error || velocity.error || workload.error;
  const chartsFetching =
    burndown.isFetching || velocity.isFetching || workload.isFetching;

  function refetchCharts() {
    return Promise.all([
      burndown.refetch(),
      velocity.refetch(),
      workload.refetch(),
    ]);
  }

  return (
    <>
      {isLoading ? <ReportsSkeleton /> : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : "Failed to load platform reports."}
          </p>
          <Button
            className="mt-4"
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.totalOrganizations === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">No organizations yet</p>
            <p className="mt-2 text-sm text-text-secondary">
              Platform growth and completion metrics will appear once
              organizations register.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {projectsLoading && !projectId ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : null}

            {!projectsLoading && !projectId ? (
              <ProjectPicker
                projects={projects}
                getProjectHref={(project) =>
                  `/super-admin/reports?projectId=${project._id}`
                }
                actionLabel="View project reports"
                emptyTitle="No projects yet"
                emptyDescription="Projects will appear here once organizations create them."
                renderSubtitle={(project) =>
                  project.organizationName ? (
                    <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                      {project.organizationName}
                    </p>
                  ) : null
                }
              />
            ) : null}

            {projectId ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-secondary">
                    Project drill-down
                  </p>
                  <p className="mt-1 font-medium text-text-primary">
                    {selectedProject?.name ?? "Selected project"}
                  </p>
                  {selectedProject?.organizationName ? (
                    <p className="mt-1 text-sm text-text-secondary">
                      {selectedProject.organizationName}
                    </p>
                  ) : null}
                </div>
                <Link
                  to="/super-admin/reports"
                  className="text-sm font-medium text-primary"
                >
                  Change project
                </Link>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total organizations"
                value={data.totalOrganizations ?? 0}
              />
              <MetricCard label="Total users" value={data.totalUsers ?? 0} />
              <MetricCard
                label="Total projects"
                value={data.totalProjects ?? 0}
              />
              <MetricCard label="Total tasks" value={data.totalTasks ?? 0} />
              <PercentMetricCard
                label="Task completion rate"
                value={data.taskCompletionRate}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <UsersByRoleBreakdown usersByRole={data.usersByRole} />
              <OrgGrowthChart series={data.organizationsRegisteredByMonth} />
            </div>

            {projectId && chartsLoading ? <ReportsSkeleton /> : null}

            {projectId && chartsError ? (
              <Card className="p-6">
                <p className="text-text-secondary">
                  {chartsFetchError instanceof Error
                    ? chartsFetchError.message
                    : "Failed to load project reports."}
                </p>
                <Button
                  className="mt-4"
                  onClick={() => refetchCharts()}
                  isLoading={chartsFetching}
                >
                  Retry
                </Button>
              </Card>
            ) : null}

            {projectId && !chartsLoading && !chartsError ? (
              <div className="space-y-4 border-t border-border pt-8">
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
          </div>
        )
      ) : null}
    </>
  );
}

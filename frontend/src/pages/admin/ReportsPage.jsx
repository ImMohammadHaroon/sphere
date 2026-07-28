import { Link, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { BurndownChart } from "@/features/reports/BurndownChart";
import { CompletionTrendChart } from "@/features/reports/CompletionTrendChart";
import { ReportsSkeleton } from "@/features/reports/ReportsSkeleton";
import { VelocityChart } from "@/features/reports/VelocityChart";
import { WorkloadChart } from "@/features/reports/WorkloadChart";
import {
  useBurndownReport,
  useVelocityReport,
  useWorkloadReport,
} from "@/features/reports/hooks/useProjectReports";
import { useOrgReportsOverview } from "@/features/reports/hooks/useOverviewReports";
import { useProjects } from "@/features/projects/hooks/useProjects";
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

function HintMetricCard({ label, value, hint }) {
  return (
    <Card className="bg-dashboard-accent-subtle p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-primary sm:text-3xl">
        {Number(value).toLocaleString()}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      ) : null}
    </Card>
  );
}

export function ReportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";

  useDashboardPageMeta({
    title: "Reports",
    description: "Org-wide analytics and workload and velocity across projects.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgReportsOverview();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const burndown = useBurndownReport(projectId);
  const velocity = useVelocityReport(projectId);
  const workload = useWorkloadReport(projectId);

  const selectedProject = (projects ?? []).find(
    (project) => project._id === projectId
  );

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
              : "Failed to load org reports."}
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
              projects={projects ?? []}
              getProjectHref={(project) =>
                `/admin/reports?projectId=${project._id}`
              }
              actionLabel="View project reports"
              emptyTitle="No projects yet"
              emptyDescription="Create a project to drill into burndown, velocity, and workload."
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
              </div>
              <Link
                to="/admin/reports"
                className="text-sm font-medium text-primary"
              >
                Change project
              </Link>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <HintMetricCard
              label="Total projects"
              value={data.projects?.total ?? 0}
              hint={`${data.projects?.active ?? 0} active · ${data.projects?.archived ?? 0} archived`}
            />
            <HintMetricCard
              label="Total tasks"
              value={data.totalTasks ?? 0}
              hint={`${data.tasksDone ?? 0} done · ${data.tasksNotDone ?? 0} not done`}
            />
            <MetricCard label="Team members" value={data.teamSize ?? 0} />
            <PercentMetricCard
              label="Milestone approval rate"
              value={data.milestones?.approvalRate}
            />
          </div>

          <CompletionTrendChart
            trend={data.completionTrend}
            description="Daily task completions across all projects in your organization."
          />

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
      ) : null}
    </>
  );
}

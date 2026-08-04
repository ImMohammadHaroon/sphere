import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { SummaryBreakdownList } from "@/components/overview/SummaryBreakdownList";
import { UserPreviewList } from "@/components/overview/UserPreviewList";
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
import { useOrgUsers } from "@/features/org/hooks/useOrgUsers";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  HintMetricCard,
  MetricCard,
  PercentMetricCard,
} from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";

const METRIC_KEYS = {
  totalProjects: "totalProjects",
  totalTasks: "totalTasks",
  teamMembers: "teamMembers",
  milestoneApprovalRate: "milestoneApprovalRate",
};

const METRIC_TONES = {
  [METRIC_KEYS.totalProjects]: "violet",
  [METRIC_KEYS.totalTasks]: "blue",
  [METRIC_KEYS.teamMembers]: "emerald",
  [METRIC_KEYS.milestoneApprovalRate]: "amber",
};

export function ReportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [activeMetric, setActiveMetric] = useState(null);

  useDashboardPageMeta({
    title: "Reports",
    description: "Org-wide analytics and workload and velocity across projects.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgReportsOverview();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: users, isLoading: usersLoading } = useOrgUsers();

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

  function getDialogConfig() {
    if (!data) return null;

    switch (activeMetric) {
      case METRIC_KEYS.totalProjects:
        return {
          title: "Total projects",
          description: `${data.projects?.total ?? 0} project${data.projects?.total === 1 ? "" : "s"} in your organization.`,
          viewAllHref: "/admin/projects",
          viewAllLabel: "View all projects",
          isEmpty: (projects ?? []).length === 0,
          content: (
            <ProjectPreviewList projects={projects ?? []} role="org_admin" />
          ),
        };
      case METRIC_KEYS.totalTasks:
        return {
          title: "Total tasks",
          description: `${data.totalTasks ?? 0} task${data.totalTasks === 1 ? "" : "s"} across all projects.`,
          viewAllHref: "/admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data.totalTasks ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                { label: "Done", value: data.tasksDone ?? 0 },
                { label: "Not done", value: data.tasksNotDone ?? 0 },
              ]}
            />
          ),
        };
      case METRIC_KEYS.teamMembers:
        return {
          title: "Team members",
          description: `${data.teamSize ?? 0} team member${data.teamSize === 1 ? "" : "s"}.`,
          viewAllHref: "/admin/users",
          viewAllLabel: "View all members",
          isLoading: usersLoading,
          isEmpty: (users ?? []).length === 0,
          content: <UserPreviewList users={users ?? []} role="org_admin" />,
        };
      case METRIC_KEYS.milestoneApprovalRate:
        return {
          title: "Milestone approval rate",
          description: "Milestone decisions across your organization.",
          viewAllHref: "/admin/projects",
          viewAllLabel: "View all projects",
          isEmpty:
            (data.milestones?.pending ?? 0) +
              (data.milestones?.approved ?? 0) +
              (data.milestones?.rejected ?? 0) ===
            0,
          content: (
            <SummaryBreakdownList
              items={[
                { label: "Pending", value: data.milestones?.pending ?? 0 },
                { label: "Approved", value: data.milestones?.approved ?? 0 },
                { label: "Rejected", value: data.milestones?.rejected ?? 0 },
              ]}
            />
          ),
        };
      default:
        return null;
    }
  }

  const dialogConfig = getDialogConfig();

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
              tone="violet"
              onClick={() => setActiveMetric(METRIC_KEYS.totalProjects)}
            />
            <HintMetricCard
              label="Total tasks"
              value={data.totalTasks ?? 0}
              hint={`${data.tasksDone ?? 0} done · ${data.tasksNotDone ?? 0} not done`}
              tone="blue"
              onClick={() => setActiveMetric(METRIC_KEYS.totalTasks)}
            />
            <MetricCard
              label="Team members"
              value={data.teamSize ?? 0}
              tone="emerald"
              onClick={() => setActiveMetric(METRIC_KEYS.teamMembers)}
            />
            <PercentMetricCard
              label="Milestone approval rate"
              value={data.milestones?.approvalRate}
              tone="amber"
              onClick={() => setActiveMetric(METRIC_KEYS.milestoneApprovalRate)}
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

      {dialogConfig ? (
        <MetricCardDetailDialog
          open={activeMetric != null}
          onOpenChange={(open) => {
            if (!open) setActiveMetric(null);
          }}
          title={dialogConfig.title}
          description={dialogConfig.description}
          viewAllHref={dialogConfig.viewAllHref}
          viewAllLabel={dialogConfig.viewAllLabel}
          tone={METRIC_TONES[activeMetric]}
          isLoading={dialogConfig.isLoading}
          isEmpty={dialogConfig.isEmpty}
        >
          {dialogConfig.content}
        </MetricCardDetailDialog>
      ) : null}
    </>
  );
}

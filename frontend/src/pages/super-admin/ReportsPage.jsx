import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { OrganizationPreviewList } from "@/components/overview/OrganizationPreviewList";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { SummaryBreakdownList } from "@/components/overview/SummaryBreakdownList";
import { UserPreviewList } from "@/components/overview/UserPreviewList";
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
import { useAllUsers } from "@/features/platform/hooks/useAllUsers";
import { useOrganizations } from "@/features/platform/hooks/useOrganizations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard, PercentMetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";

const METRIC_KEYS = {
  totalOrganizations: "totalOrganizations",
  totalUsers: "totalUsers",
  totalProjects: "totalProjects",
  totalTasks: "totalTasks",
  taskCompletionRate: "taskCompletionRate",
};

const METRIC_TONES = {
  [METRIC_KEYS.totalOrganizations]: "blue",
  [METRIC_KEYS.totalUsers]: "emerald",
  [METRIC_KEYS.totalProjects]: "orange",
  [METRIC_KEYS.totalTasks]: "violet",
  [METRIC_KEYS.taskCompletionRate]: "amber",
};

export function SuperAdminReportsPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [activeMetric, setActiveMetric] = useState(null);

  useDashboardPageMeta({
    title: "Reports",
    description: "Platform-wide analytics and growth.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformReportsOverview();
  const { data: projectsData, isLoading: projectsLoading } =
    usePlatformProjects();
  const { data: organizationsData, isLoading: organizationsLoading } =
    useOrganizations({ page: 1, limit: 5 });
  const { data: usersData, isLoading: usersLoading } = useAllUsers({
    page: 1,
    limit: 5,
  });

  const projects = projectsData?.projects ?? [];

  const burndown = usePlatformBurndownReport(projectId);
  const velocity = usePlatformVelocityReport(projectId);
  const workload = usePlatformWorkloadReport(projectId);

  const selectedProject = projects.find((project) => project._id === projectId);

  const usersByRoleItems = useMemo(() => {
    if (!data?.usersByRole) return [];
    return Object.entries(data.usersByRole).map(([role, count]) => ({
      label: role.replaceAll("_", " "),
      value: count,
    }));
  }, [data?.usersByRole]);

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
      case METRIC_KEYS.totalOrganizations:
        return {
          title: "Total organizations",
          description: `${data.totalOrganizations ?? 0} organization${data.totalOrganizations === 1 ? "" : "s"} on the platform.`,
          viewAllHref: "/super-admin/organizations",
          viewAllLabel: "View all organizations",
          isLoading: organizationsLoading,
          isEmpty: (organizationsData?.organizations ?? []).length === 0,
          content: (
            <OrganizationPreviewList
              organizations={organizationsData?.organizations ?? []}
            />
          ),
        };
      case METRIC_KEYS.totalUsers:
        return {
          title: "Total users",
          description: `${data.totalUsers ?? 0} user${data.totalUsers === 1 ? "" : "s"} on the platform.`,
          viewAllHref: "/super-admin/users",
          viewAllLabel: "View all users",
          isLoading: usersLoading,
          isEmpty: (usersData?.users ?? []).length === 0,
          content: (
            <UserPreviewList users={usersData?.users ?? []} role="super_admin" />
          ),
        };
      case METRIC_KEYS.totalProjects:
        return {
          title: "Total projects",
          description: `${data.totalProjects ?? 0} project${data.totalProjects === 1 ? "" : "s"} across all organizations.`,
          viewAllHref: "/super-admin/reports",
          viewAllLabel: "View reports",
          isLoading: projectsLoading,
          isEmpty: projects.length === 0,
          content: (
            <ProjectPreviewList
              projects={projects}
              getProjectHref={(project) =>
                `/super-admin/reports?projectId=${project._id}`
              }
            />
          ),
        };
      case METRIC_KEYS.totalTasks:
        return {
          title: "Total tasks",
          description: `${data.totalTasks ?? 0} task${data.totalTasks === 1 ? "" : "s"} on the platform.`,
          viewAllHref: "/super-admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data.totalTasks ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                {
                  label: "Completed",
                  value: Math.round(
                    (data.totalTasks ?? 0) * (data.taskCompletionRate ?? 0)
                  ),
                },
                {
                  label: "Remaining",
                  value: Math.round(
                    (data.totalTasks ?? 0) * (1 - (data.taskCompletionRate ?? 0))
                  ),
                },
              ]}
            />
          ),
        };
      case METRIC_KEYS.taskCompletionRate:
        return {
          title: "Task completion rate",
          description: "Platform-wide task completion breakdown.",
          viewAllHref: "/super-admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data.totalTasks ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                ...usersByRoleItems,
                {
                  label: "Completion rate",
                  value: `${Math.round((data.taskCompletionRate ?? 0) * 100)}%`,
                },
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
                tone="blue"
                onClick={() => setActiveMetric(METRIC_KEYS.totalOrganizations)}
              />
              <MetricCard
                label="Total users"
                value={data.totalUsers ?? 0}
                tone="emerald"
                onClick={() => setActiveMetric(METRIC_KEYS.totalUsers)}
              />
              <MetricCard
                label="Total projects"
                value={data.totalProjects ?? 0}
                tone="orange"
                onClick={() => setActiveMetric(METRIC_KEYS.totalProjects)}
              />
              <MetricCard
                label="Total tasks"
                value={data.totalTasks ?? 0}
                tone="violet"
                onClick={() => setActiveMetric(METRIC_KEYS.totalTasks)}
              />
              <PercentMetricCard
                label="Task completion rate"
                value={data.taskCompletionRate}
                tone="amber"
                onClick={() => setActiveMetric(METRIC_KEYS.taskCompletionRate)}
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

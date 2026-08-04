import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { OrganizationPreviewList } from "@/components/overview/OrganizationPreviewList";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { UserPreviewList } from "@/components/overview/UserPreviewList";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { TasksByStatusChart } from "@/components/overview/TasksByStatusChart";
import { usePlatformProjects } from "@/features/projects/hooks/usePlatformProjects";
import { useAllUsers } from "@/features/platform/hooks/useAllUsers";
import { useOrganizations } from "@/features/platform/hooks/useOrganizations";
import { usePendingOrganizations } from "@/features/platform/hooks/usePendingOrganizations";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { SummaryBreakdownList } from "@/components/overview/SummaryBreakdownList";
import { MetricCard, PercentMetricCard } from "@/components/ui/MetricCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const METRIC_KEYS = {
  totalOrganizations: "totalOrganizations",
  activeUsers: "activeUsers",
  activeProjects: "activeProjects",
  pendingApprovals: "pendingApprovals",
  taskCompletionRate: "taskCompletionRate",
  newOrganizations30d: "newOrganizations30d",
};

const METRIC_TONES = {
  [METRIC_KEYS.totalOrganizations]: "blue",
  [METRIC_KEYS.activeUsers]: "emerald",
  [METRIC_KEYS.activeProjects]: "orange",
  [METRIC_KEYS.pendingApprovals]: "rose",
  [METRIC_KEYS.taskCompletionRate]: "violet",
  [METRIC_KEYS.newOrganizations30d]: "amber",
};

export function PlatformOverviewPage() {
  useDashboardPageMeta({
    title: "Platform overview",
    showPageHeader: false,
  });

  const [activeMetric, setActiveMetric] = useState(null);
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformOverview();
  const { data: organizationsData, isLoading: organizationsLoading } =
    useOrganizations({ page: 1, limit: 5 });
  const { data: usersData, isLoading: usersLoading } = useAllUsers({
    page: 1,
    limit: 5,
  });
  const { data: pendingData, isLoading: pendingLoading } =
    usePendingOrganizations({ page: 1, limit: 5 });
  const { data: platformProjectsData, isLoading: projectsLoading } =
    usePlatformProjects({ page: 1, limit: 20 });

  const activeProjects = useMemo(() => {
    return (platformProjectsData?.projects ?? []).filter(
      (project) => project.status === "active"
    );
  }, [platformProjectsData]);

  function getDialogConfig() {
    switch (activeMetric) {
      case METRIC_KEYS.totalOrganizations:
        return {
          title: "Total organizations",
          description: `${data?.totalOrganizations ?? 0} organization${data?.totalOrganizations === 1 ? "" : "s"} on the platform.`,
          viewAllHref: "/super-admin/organizations",
          viewAllLabel: "View all organizations",
          isLoading: organizationsLoading,
          isEmpty: (organizationsData?.organizations ?? data?.recentOrganizations ?? []).length === 0,
          content: (
            <OrganizationPreviewList
              organizations={
                organizationsData?.organizations ?? data?.recentOrganizations ?? []
              }
            />
          ),
        };
      case METRIC_KEYS.activeUsers:
        return {
          title: "Active users",
          description: `${data?.activeUsers ?? data?.totalUsers ?? 0} active user${(data?.activeUsers ?? data?.totalUsers) === 1 ? "" : "s"}.`,
          viewAllHref: "/super-admin/users",
          viewAllLabel: "View all users",
          isLoading: usersLoading,
          isEmpty: (usersData?.users ?? []).length === 0,
          content: (
            <UserPreviewList
              users={usersData?.users ?? []}
              role="super_admin"
            />
          ),
        };
      case METRIC_KEYS.activeProjects:
        return {
          title: "Active projects",
          description: `${data?.activeProjects ?? 0} active project${data?.activeProjects === 1 ? "" : "s"} across all organizations.`,
          viewAllHref: "/super-admin/reports",
          viewAllLabel: "View reports",
          isLoading: projectsLoading,
          isEmpty: activeProjects.length === 0,
          content: (
            <ProjectPreviewList
              projects={activeProjects.map((project) => ({
                ...project,
                name: project.organizationName
                  ? `${project.name} · ${project.organizationName}`
                  : project.name,
              }))}
              getProjectHref={(project) =>
                `/super-admin/reports?projectId=${project._id}`
              }
            />
          ),
        };
      case METRIC_KEYS.pendingApprovals:
        return {
          title: "Pending approvals",
          description: `${data?.pendingOrganizations ?? 0} organization${data?.pendingOrganizations === 1 ? "" : "s"} awaiting approval.`,
          viewAllHref: "/super-admin/organizations",
          viewAllLabel: "View pending approvals",
          isLoading: pendingLoading,
          isEmpty: (pendingData?.organizations ?? []).length === 0,
          emptyMessage: "No pending approvals.",
          content: (
            <OrganizationPreviewList
              organizations={pendingData?.organizations ?? []}
              showPending
            />
          ),
        };
      case METRIC_KEYS.taskCompletionRate:
        return {
          title: "Task completion rate",
          description: "Platform-wide task completion breakdown.",
          viewAllHref: "/super-admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data?.totalTasks ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                {
                  label: "Completion rate",
                  value: `${Math.round((data?.taskCompletionRate ?? 0) * 100)}%`,
                },
                { label: "Tasks done", value: data?.tasksDone ?? 0 },
                { label: "Tasks not done", value: data?.tasksNotDone ?? 0 },
              ]}
            />
          ),
        };
      case METRIC_KEYS.newOrganizations30d:
        return {
          title: "New organizations (30d)",
          description: `${data?.newOrganizationsLast30Days ?? 0} new organization${data?.newOrganizationsLast30Days === 1 ? "" : "s"} in the last 30 days.`,
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
      default:
        return null;
    }
  }

  const dialogConfig = getDialogConfig();

  return (
    <>
      <h1 className="font-display text-xl font-semibold sm:text-2xl">Platform overview</h1>

      {isLoading ? <OverviewSkeleton /> : null}

      {isError ? (
        <Card className="mt-8 p-6">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : "Failed to load platform overview."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.totalOrganizations === 0 && (data.pendingOrganizations ?? 0) === 0 ? (
          <Card className="mt-8 p-8 text-center">
            <p className="font-medium text-text-primary">No organizations yet</p>
            <p className="mt-2 text-sm text-text-secondary">
              When organizations register on the platform, their metrics will appear
              here.
            </p>
          </Card>
        ) : (
          <div className="mt-8 space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard
                label="Total organizations"
                value={data.totalOrganizations}
                tone="blue"
                onClick={() => setActiveMetric(METRIC_KEYS.totalOrganizations)}
              />
              <MetricCard
                label="Active users"
                value={data.activeUsers ?? data.totalUsers}
                tone="emerald"
                onClick={() => setActiveMetric(METRIC_KEYS.activeUsers)}
              />
              <MetricCard
                label="Active projects"
                value={data.activeProjects ?? 0}
                tone="orange"
                onClick={() => setActiveMetric(METRIC_KEYS.activeProjects)}
              />
              <MetricCard
                label="Pending approvals"
                value={data.pendingOrganizations ?? 0}
                tone="rose"
                onClick={() => setActiveMetric(METRIC_KEYS.pendingApprovals)}
              />
              <PercentMetricCard
                label="Task completion rate"
                value={data.taskCompletionRate}
                tone="violet"
                onClick={() => setActiveMetric(METRIC_KEYS.taskCompletionRate)}
              />
              <MetricCard
                label="New organizations (30d)"
                value={data.newOrganizationsLast30Days ?? 0}
                tone="amber"
                onClick={() => setActiveMetric(METRIC_KEYS.newOrganizations30d)}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.totalTasks > 0 ? (
                <TasksByStatusChart
                  tasksByProject={data.tasksByProject}
                  description="Platform-wide task distribution across Kanban columns."
                />
              ) : (
                <Card className="flex h-full min-h-72 items-center justify-center p-6">
                  <p className="text-sm text-text-secondary">
                    No tasks on the platform yet.
                  </p>
                </Card>
              )}

              <Card className="flex h-full min-h-72 flex-col overflow-hidden p-0">
                <div className="border-b border-border px-4 py-4 sm:px-6">
                  <h2 className="font-display text-lg font-semibold">
                    Recent organizations
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Latest five organizations by signup date.
                  </p>
                </div>

                {data.recentOrganizations.length === 0 ? (
                  <p className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-text-secondary sm:px-6">
                    No recent organizations to display.
                  </p>
                ) : (
                  <TableScrollArea className="flex-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Users</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentOrganizations.map((org) => (
                          <TableRow key={org._id}>
                            <TableCell>
                              <Link
                                to={`/super-admin/organizations/${org._id}`}
                                className={cn(
                                  "font-medium text-primary hover:underline"
                                )}
                              >
                                {org.name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                              {org.userCount}
                            </TableCell>
                            <TableCell>
                              <Badge variant={org.isActive ? "success" : "danger"}>
                                {org.isActive ? "Active" : "Suspended"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                              {formatDate(org.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableScrollArea>
                )}
              </Card>
            </div>
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
          onViewAll={dialogConfig.onViewAll}
          viewAllLabel={dialogConfig.viewAllLabel}
          tone={METRIC_TONES[activeMetric]}
          isLoading={dialogConfig.isLoading}
          isEmpty={dialogConfig.isEmpty}
          emptyMessage={dialogConfig.emptyMessage}
        >
          {dialogConfig.content}
        </MetricCardDetailDialog>
      ) : null}
    </>
  );
}

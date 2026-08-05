import { useMemo, useState } from "react";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { SummaryBreakdownList } from "@/components/overview/SummaryBreakdownList";
import { UserPreviewList } from "@/components/overview/UserPreviewList";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { TasksByStatusChart } from "@/components/overview/TasksByStatusChart";
import { useOrgOverview } from "@/features/org/hooks/useOrgOverview";
import { useOrgUsers } from "@/features/org/hooks/useOrgUsers";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";
import { totalTaskCountFromProjects } from "@/lib/taskStatusConfig";
import { RecordTaskButton } from "@/features/task-recording/components/RecordTaskButton";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const METRIC_KEYS = {
  totalProjects: "totalProjects",
  activeProjects: "activeProjects",
  teamSize: "teamSize",
  totalTasks: "totalTasks",
  tasksCompleted30d: "tasksCompleted30d",
};

const METRIC_TONES = {
  [METRIC_KEYS.totalProjects]: "violet",
  [METRIC_KEYS.activeProjects]: "emerald",
  [METRIC_KEYS.teamSize]: "blue",
  [METRIC_KEYS.totalTasks]: "orange",
  [METRIC_KEYS.tasksCompleted30d]: "teal",
};

export function OrgOverviewPage() {
  useDashboardPageMeta({
    title: "Org overview",
    description: "Active projects, team size, and organization KPIs.",
  });

  const [activeMetric, setActiveMetric] = useState(null);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgOverview();
  const { data: projects } = useProjects();
  const { data: users, isLoading: usersLoading } = useOrgUsers();

  const totalTasks = data ? totalTaskCountFromProjects(data.tasksByProject) : 0;
  const activeProjects = useMemo(
    () => (projects ?? []).filter((project) => project.status === "active"),
    [projects]
  );

  function getDialogConfig() {
    switch (activeMetric) {
      case METRIC_KEYS.totalProjects:
        return {
          title: "Total projects",
          description: `${data?.projects.total ?? 0} project${data?.projects.total === 1 ? "" : "s"} in your organization.`,
          viewAllHref: "/admin/projects",
          viewAllLabel: "View all projects",
          isEmpty: (projects ?? []).length === 0,
          content: (
            <ProjectPreviewList projects={projects ?? []} role="org_admin" />
          ),
        };
      case METRIC_KEYS.activeProjects:
        return {
          title: "Active projects",
          description: `${data?.projects.active ?? 0} active project${data?.projects.active === 1 ? "" : "s"}.`,
          viewAllHref: "/admin/projects",
          viewAllLabel: "View all projects",
          isEmpty: activeProjects.length === 0,
          content: (
            <ProjectPreviewList projects={activeProjects} role="org_admin" />
          ),
        };
      case METRIC_KEYS.teamSize:
        return {
          title: "Team size",
          description: `${data?.teamSize ?? 0} team member${data?.teamSize === 1 ? "" : "s"}.`,
          viewAllHref: "/admin/users",
          viewAllLabel: "View all members",
          isLoading: usersLoading,
          isEmpty: (users ?? []).length === 0,
          content: <UserPreviewList users={users ?? []} role="org_admin" />,
        };
      case METRIC_KEYS.totalTasks:
        return {
          title: "Total tasks",
          description: `${data?.totalTasks ?? 0} task${data?.totalTasks === 1 ? "" : "s"} across your organization.`,
          viewAllHref: "/admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data?.totalTasks ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                { label: "Done", value: data?.tasksDone ?? 0 },
                { label: "Not done", value: data?.tasksNotDone ?? 0 },
              ]}
            />
          ),
        };
      case METRIC_KEYS.tasksCompleted30d:
        return {
          title: "Tasks completed (30d)",
          description: `${data?.tasksCompletedLast30Days ?? 0} task${data?.tasksCompletedLast30Days === 1 ? "" : "s"} completed in the last 30 days.`,
          viewAllHref: "/admin/reports",
          viewAllLabel: "View reports",
          isEmpty: (data?.tasksCompletedLast30Days ?? 0) === 0,
          content: (
            <SummaryBreakdownList
              items={[
                {
                  label: "Completed last 30 days",
                  value: data?.tasksCompletedLast30Days ?? 0,
                },
                { label: "Total tasks", value: data?.totalTasks ?? 0 },
                { label: "Done overall", value: data?.tasksDone ?? 0 },
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
      {isLoading ? (
        <OverviewSkeleton metricCount={5} showSecondaryPanel={false} />
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load overview."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.projects.total === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium text-text-primary">No projects yet</p>
            <p className="mt-2 text-sm text-text-secondary">
              When projects are created in your organization, their metrics will
              appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-end">
              <RecordTaskButton />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <MetricCard
                label="Total projects"
                value={data.projects.total}
                tone="violet"
                onClick={() => setActiveMetric(METRIC_KEYS.totalProjects)}
              />
              <MetricCard
                label="Active projects"
                value={data.projects.active}
                tone="emerald"
                onClick={() => setActiveMetric(METRIC_KEYS.activeProjects)}
              />
              <MetricCard
                label="Team size"
                value={data.teamSize}
                tone="blue"
                onClick={() => setActiveMetric(METRIC_KEYS.teamSize)}
              />
              <MetricCard
                label="Total tasks"
                value={data.totalTasks ?? 0}
                tone="orange"
                onClick={() => setActiveMetric(METRIC_KEYS.totalTasks)}
              />
              <MetricCard
                label="Tasks completed (30d)"
                value={data.tasksCompletedLast30Days ?? 0}
                tone="teal"
                onClick={() => setActiveMetric(METRIC_KEYS.tasksCompleted30d)}
              />
            </div>

            {totalTasks > 0 ? (
              <TasksByStatusChart
                tasksByProject={data.tasksByProject}
                description="Organization task distribution across Kanban columns."
              />
            ) : (
              <Card className="flex min-h-72 items-center justify-center p-6">
                <p className="text-sm text-text-secondary">
                  No tasks in your organization yet.
                </p>
              </Card>
            )}

            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-4 py-4 sm:px-6">
                <h2 className="font-display text-lg font-semibold">
                  Recent projects
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Latest five projects by last update.
                </p>
              </div>

              {data.recentProjects.length === 0 ? (
                <p className="px-4 py-8 text-sm text-text-secondary sm:px-6">
                  No recent projects to display.
                </p>
              ) : (
                <TableScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last updated</TableHead>
                        <TableHead className="w-[1%]">
                          <span className="sr-only">Actions</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.status === "active" ? "success" : "muted"
                              }
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatDate(project.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <ButtonLink
                              to={`/admin/projects/${project.id}`}
                              variant="ghost"
                              size="sm"
                            >
                              View detail
                            </ButtonLink>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScrollArea>
              )}
            </Card>
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

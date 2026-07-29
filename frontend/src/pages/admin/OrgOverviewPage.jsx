import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { TasksByStatusChart } from "@/components/overview/TasksByStatusChart";
import { useOrgOverview } from "@/features/org/hooks/useOrgOverview";
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

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OrgOverviewPage() {
  useDashboardPageMeta({
    title: "Org overview",
    description: "Active projects, team size, and organization KPIs.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgOverview();

  const totalTasks = data ? totalTaskCountFromProjects(data.tasksByProject) : 0;

  return (
    <>
      {isLoading ? (
        <OverviewSkeleton metricCount={3} showSecondaryPanel={false} />
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
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Total projects" value={data.projects.total} />
              <MetricCard label="Active projects" value={data.projects.active} />
              <MetricCard label="Team size" value={data.teamSize} />
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
    </>
  );
}

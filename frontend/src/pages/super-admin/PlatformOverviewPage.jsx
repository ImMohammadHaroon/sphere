import { Link } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { TasksByStatusChart } from "@/components/overview/TasksByStatusChart";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { MetricCard } from "@/components/ui/MetricCard";
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

export function PlatformOverviewPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformOverview();

  return (
    <SuperAdminLayout>
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total organizations"
                value={data.totalOrganizations}
              />
              <MetricCard
                label="Active users"
                value={data.activeUsers ?? data.totalUsers}
              />
              <MetricCard
                label="Active projects"
                value={data.activeProjects ?? 0}
              />
              <MetricCard
                label="Pending approvals"
                value={data.pendingOrganizations ?? 0}
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
    </SuperAdminLayout>
  );
}

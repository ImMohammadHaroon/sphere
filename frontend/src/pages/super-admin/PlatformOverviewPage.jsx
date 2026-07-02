import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { usePlatformOverview } from "@/features/platform/hooks/usePlatformOverview";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

const TASK_STATUS_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

const TASK_STATUS_COLORS = {
  todo: "hsl(var(--kanban-todo))",
  "in-progress": "hsl(var(--kanban-progress))",
  review: "hsl(var(--kanban-review))",
  done: "hsl(var(--kanban-done))",
};

function planBadgeVariant(plan) {
  switch (plan) {
    case "enterprise":
      return "success";
    case "pro":
      return "accent";
    default:
      return "muted";
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MetricCard({ label, value }) {
  return (
    <Card className="bg-primary-subtle/60 p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-primary">
        {value.toLocaleString()}
      </p>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

function TasksByStatusChart({ tasksByStatus }) {
  const data = Object.keys(TASK_STATUS_LABELS).map((key) => ({
    status: TASK_STATUS_LABELS[key],
    key,
    count: tasksByStatus[key],
  }));

  return (
    <Card className="h-full">
      <h2 className="font-display text-lg font-semibold">Tasks by status</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Platform-wide task distribution across Kanban columns.
      </p>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="status"
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--surface-raised))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--text-primary))",
              }}
              cursor={{ fill: "hsl(var(--primary-subtle))" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={TASK_STATUS_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function PlatformOverviewPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformOverview();

  return (
    <SuperAdminLayout>
      <h1 className="font-display text-2xl font-semibold">Platform overview</h1>

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
        data.totalOrganizations === 0 ? (
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
                label="Active projects"
                value={data.activeProjects}
              />
              <MetricCard label="Total users" value={data.totalUsers} />
              <MetricCard label="Total tasks" value={data.totalTasks} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.totalTasks > 0 ? (
                <TasksByStatusChart tasksByStatus={data.tasksByStatus} />
              ) : (
                <Card className="flex h-full min-h-72 items-center justify-center p-6">
                  <p className="text-sm text-text-secondary">
                    No tasks on the platform yet.
                  </p>
                </Card>
              )}

              <Card className="flex h-full min-h-72 flex-col justify-center bg-primary-subtle/60 p-8">
                <p className="text-sm font-medium text-text-secondary">
                  New organizations (30 days)
                </p>
                <p className="mt-4 font-display text-5xl font-semibold text-primary">
                  {data.newOrganizationsLast30Days.toLocaleString()}
                </p>
                <p className="mt-3 text-sm text-text-secondary">
                  {data.activeOrganizations} of {data.totalOrganizations}{" "}
                  organizations are currently active.
                </p>
              </Card>
            </div>

            <Card className="overflow-hidden p-0">
              <div className="border-b border-border px-6 py-4">
                <h2 className="font-display text-lg font-semibold">
                  Recent organizations
                </h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Latest five organizations by signup date.
                </p>
              </div>

              {data.recentOrganizations.length === 0 ? (
                <p className="px-6 py-8 text-sm text-text-secondary">
                  No recent organizations to display.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Plan</TableHead>
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
                        <TableCell>
                          <Badge variant={planBadgeVariant(org.plan)}>
                            {org.plan}
                          </Badge>
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
              )}
            </Card>
          </div>
        )
      ) : null}
    </SuperAdminLayout>
  );
}

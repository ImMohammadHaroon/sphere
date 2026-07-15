import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { OrgGrowthChart } from "@/features/reports/OrgGrowthChart";
import { UsersByRoleBreakdown } from "@/features/reports/UsersByRoleBreakdown";
import { usePlatformReportsOverview } from "@/features/reports/hooks/useOverviewReports";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";

function formatPercent(rate) {
  if (rate == null || Number.isNaN(Number(rate))) {
    return "—";
  }
  return `${Math.round(Number(rate) * 100)}%`;
}

function PercentMetricCard({ label, value }) {
  return (
    <Card className="bg-primary-subtle/60 p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-primary sm:text-3xl">
        {formatPercent(value)}
      </p>
    </Card>
  );
}

export function SuperAdminReportsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformReportsOverview();

  return (
    <SuperAdminLayout
      title="Reports"
      description="Platform-wide analytics and growth."
    >
      {isLoading ? <OverviewSkeleton metricCount={5} /> : null}

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
          </div>
        )
      ) : null}
    </SuperAdminLayout>
  );
}

import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { OverviewSkeleton } from "@/components/overview/OverviewSkeleton";
import { CompletionTrendChart } from "@/features/reports/CompletionTrendChart";
import { useOrgReportsOverview } from "@/features/reports/hooks/useOverviewReports";
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
  useDashboardPageMeta({
    title: "Reports",
    description: "Org-wide analytics and workload and velocity across projects.",
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrgReportsOverview();

  return (
    <>
      {isLoading ? (
        <OverviewSkeleton metricCount={4} showSecondaryPanel={false} />
      ) : null}

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
        </div>
      ) : null}
    </>
  );
}

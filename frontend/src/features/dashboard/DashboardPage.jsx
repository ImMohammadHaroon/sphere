import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { TaskSummaryCards } from "@/features/dashboard/TaskSummaryCards";
import { AssignedProjectsList } from "@/features/dashboard/AssignedProjectsList";
import { AssignedTasksPreview } from "@/features/dashboard/AssignedTasksPreview";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}

export function DashboardPage() {
  useDashboardPageMeta({
    title: "Dashboard",
    description: "Your work at a glance.",
  });

  const { isLoading, isError, error, refetch, isFetching } = useDashboardData();

  return (
    <>
      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load dashboard."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-6">
          <TaskSummaryCards />
          <div className="grid gap-6 lg:grid-cols-2">
            <AssignedTasksPreview />
            <AssignedProjectsList />
          </div>
        </div>
      ) : null}
    </>
  );
}

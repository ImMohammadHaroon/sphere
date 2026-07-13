import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function ClientSummaryCards({
  activeProjectCount,
  averageCompletion,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MetricCard label="Active projects" value={activeProjectCount} />
      <MetricCard label="Average completion" value={`${averageCompletion}%`} />
    </div>
  );
}

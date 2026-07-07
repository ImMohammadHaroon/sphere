import { Skeleton } from "@/components/ui/Skeleton";

export function OverviewSkeleton({ metricCount = 4, showSecondaryPanel = true }) {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-56" />
      <div
        className={
          metricCount === 3
            ? "grid gap-4 sm:grid-cols-3"
            : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        }
      >
        {Array.from({ length: metricCount }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      {showSecondaryPanel ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Skeleton className="h-72" />
      )}
      <Skeleton className="h-64" />
    </div>
  );
}

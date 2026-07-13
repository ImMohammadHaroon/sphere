import { ClientProjectCard } from "@/features/client-portal/ClientProjectCard";
import { ClientSummaryCards } from "@/features/client-portal/ClientSummaryCards";
import { useClientProjects } from "@/features/client-portal/hooks/useClientProjects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function ClientDashboardPage() {
  const {
    projects,
    averageCompletion,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClientProjects();

  const activeProjectCount = projects.filter(
    (project) => project.status === "active"
  ).length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load projects."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-text-secondary">
          No projects have been shared with you yet
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ClientSummaryCards
        activeProjectCount={activeProjectCount}
        averageCompletion={averageCompletion}
        isLoading={false}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ClientProjectCard key={project._id} project={project} />
        ))}
      </div>
    </div>
  );
}

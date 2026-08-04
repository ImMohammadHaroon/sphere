import { ClientProjectCard } from "@/features/client-portal/ClientProjectCard";
import { ClientReviewBanner } from "@/features/client-portal/ClientReviewBanner";
import { ClientSummaryCards } from "@/features/client-portal/ClientSummaryCards";
import { useClientProjects } from "@/features/client-portal/hooks/useClientProjects";
import { useClientPendingReviews } from "@/features/client-portal/hooks/useClientPendingReviews";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function ClientDashboardPage() {
  const { user } = useAuth();
  const {
    projects,
    averageCompletion,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClientProjects();
  const { pendingCount, pendingMilestones } = useClientPendingReviews();

  const activeProjectCount = projects.filter(
    (project) => project.status === "active"
  ).length;
  const firstName = user?.name?.split(" ")[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          We could not load your projects. Please try again.
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Try again
        </Button>
      </Card>
    );
  }

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-medium text-text-primary">
          No projects yet
        </p>
        <p className="mt-2 text-text-secondary">
          When your team shares a project with you, it will show up here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg text-text-secondary">
          {firstName ? `Hi ${firstName}, ` : ""}
          here is an overview of your projects.
        </p>
      </div>

      <ClientReviewBanner pendingCount={pendingCount} />

      <ClientSummaryCards
        activeProjectCount={activeProjectCount}
        averageCompletion={averageCompletion}
        isLoading={false}
        projects={projects}
        pendingCount={pendingCount}
        pendingMilestones={pendingMilestones}
      />

      <div>
        <h2 className="mb-4 text-base font-semibold text-text-primary">
          Your projects
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ClientProjectCard key={project._id} project={project} />
          ))}
        </div>
      </div>
    </div>
  );
}

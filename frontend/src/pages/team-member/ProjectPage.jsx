import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ProjectWorkspace } from "@/features/projects/components/ProjectWorkspace";
import { useProject } from "@/features/projects/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function TeamMemberProjectPage() {
  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";

  const { data: project, isLoading, isError, error, refetch, isFetching } =
    useProject(projectId);

  useDashboardPageMeta({
    title: project?.name ?? "Project",
    description: project?.description || "Tasks and milestones for this project.",
    showBack: true,
    backLabel: "Back to dashboard",
    backTo: "/member",
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[24rem] w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load project."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  return <ProjectWorkspace projectId={projectId} role="team_member" />;
}

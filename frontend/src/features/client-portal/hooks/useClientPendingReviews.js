import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listMilestones } from "@/lib/milestonesApi";
import { useProjects } from "@/features/projects/hooks/useProjects";

export function useClientPendingReviews() {
  const { user } = useAuth();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const milestoneQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["milestones", user?.organizationId, project._id],
      queryFn: async () => {
        const result = await listMilestones(project._id);
        return result.milestones;
      },
      enabled: !!user?.organizationId && !!project._id,
      staleTime: 30_000,
    })),
  });

  const pendingMilestones = useMemo(() => {
    const items = [];
    projects.forEach((project, index) => {
      for (const milestone of milestoneQueries[index]?.data ?? []) {
        if (milestone.status === "pending") {
          items.push({ ...milestone, projectId: project._id });
        }
      }
    });
    return items;
  }, [projects, milestoneQueries]);

  const pendingCount = pendingMilestones.length;
  const milestonesLoading = milestoneQueries.some((query) => query.isLoading);

  return {
    pendingCount,
    pendingMilestones,
    isLoading: projectsLoading || milestonesLoading,
  };
}

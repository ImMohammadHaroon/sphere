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

  const pendingCount = useMemo(() => {
    return milestoneQueries.reduce((total, query) => {
      const pending = (query.data ?? []).filter(
        (milestone) => milestone.status === "pending"
      ).length;
      return total + pending;
    }, 0);
  }, [milestoneQueries]);

  const milestonesLoading = milestoneQueries.some((query) => query.isLoading);

  return {
    pendingCount,
    isLoading: projectsLoading || milestonesLoading,
  };
}

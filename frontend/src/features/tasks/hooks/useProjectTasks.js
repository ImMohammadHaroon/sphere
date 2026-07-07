import { useQuery } from "@tanstack/react-query";
import { listProjectTasks } from "@/lib/tasksApi";
import { useTaskOrgContext } from "./useTaskOrgContext";

export function useProjectTasks(projectId) {
  const { isAuthenticated, user, hasOrg } = useTaskOrgContext();

  return useQuery({
    queryKey: ["tasks", user?.organizationId, projectId],
    queryFn: async () => {
      const result = await listProjectTasks(projectId);
      return result.tasks;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

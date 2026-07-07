import { useQuery } from "@tanstack/react-query";
import { getProjectMembers } from "@/lib/tasksApi";
import { useTaskOrgContext } from "./useTaskOrgContext";

export function useProjectMembers(projectId) {
  const { isAuthenticated, user, hasOrg } = useTaskOrgContext();

  return useQuery({
    queryKey: ["projects", user?.organizationId, projectId, "members"],
    queryFn: async () => {
      const result = await getProjectMembers(projectId);
      return result.members;
    },
    staleTime: 60_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

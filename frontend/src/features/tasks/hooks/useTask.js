import { useQuery } from "@tanstack/react-query";
import { getTask } from "@/lib/tasksApi";
import { useTaskOrgContext } from "./useTaskOrgContext";

export function useTask(id) {
  const { isAuthenticated, user, hasOrg } = useTaskOrgContext();

  return useQuery({
    queryKey: ["tasks", user?.organizationId, id],
    queryFn: async () => {
      const result = await getTask(id);
      return result.task;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!id,
    retry: (failureCount, error) => {
      if (error?.status === 403 || error?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

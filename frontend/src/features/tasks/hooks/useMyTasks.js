import { useQuery } from "@tanstack/react-query";
import { listMyTasks } from "@/lib/tasksApi";
import { useAuth } from "@/hooks/useAuth";

export function useMyTasks() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["tasks", "mine", user?.organizationId, user?.id],
    queryFn: async () => {
      const result = await listMyTasks();
      return result.tasks;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && !!user?.organizationId,
  });
}

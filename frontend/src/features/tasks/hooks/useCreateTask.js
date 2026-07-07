import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/lib/tasksApi";
import { useAuth } from "@/hooks/useAuth";

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data) => createTask(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", user?.organizationId, projectId],
      });
    },
  });
}

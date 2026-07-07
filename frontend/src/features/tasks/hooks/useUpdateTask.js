import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/lib/tasksApi";
import { useAuth } from "@/hooks/useAuth";

export function useUpdateTask(taskId, projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data) => updateTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", user?.organizationId, taskId],
      });
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ["tasks", user?.organizationId, projectId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["tasks", "mine", user?.organizationId, user?.id],
      });
    },
  });
}

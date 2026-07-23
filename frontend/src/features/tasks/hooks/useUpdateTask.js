import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTask } from "@/lib/tasksApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

export function useUpdateTask(taskId, projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
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
          if (projectId) {
            queryClient.invalidateQueries({
              queryKey: ["calendar", user?.organizationId, projectId],
            });
          }
        },
      },
      { success: "Task updated." }
    )
  );
}

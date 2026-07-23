import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/lib/tasksApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

export function useCreateTask(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (data) => createTask(projectId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["tasks", user?.organizationId, projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["calendar", user?.organizationId, projectId],
          });
        },
      },
      { success: "Task created." }
    )
  );
}

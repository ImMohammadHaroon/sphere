import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/kanbanTemplatesApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

function templatesQueryKey(organizationId) {
  return ["kanban-templates", organizationId];
}

export function useKanbanTemplates() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return useQuery({
    queryKey: templatesQueryKey(user?.organizationId),
    queryFn: async () => {
      const result = await listTemplates();
      return result.templates ?? [];
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg,
  });
}

export function useCreateKanbanTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: createTemplate,
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: templatesQueryKey(user?.organizationId),
          });
        },
      },
      { success: "Kanban template created." }
    )
  );
}

export function useUpdateKanbanTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, data }) => updateTemplate(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: templatesQueryKey(user?.organizationId),
          });
        },
      },
      { success: "Kanban template updated." }
    )
  );
}

export function useDeleteKanbanTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: deleteTemplate,
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: templatesQueryKey(user?.organizationId),
          });
        },
      },
      { success: "Kanban template deleted." }
    )
  );
}

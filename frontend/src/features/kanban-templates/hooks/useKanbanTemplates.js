import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/lib/kanbanTemplatesApi";
import { useAuth } from "@/hooks/useAuth";

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

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templatesQueryKey(user?.organizationId),
      });
    },
  });
}

export function useUpdateKanbanTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }) => updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templatesQueryKey(user?.organizationId),
      });
    },
  });
}

export function useDeleteKanbanTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: templatesQueryKey(user?.organizationId),
      });
    },
  });
}

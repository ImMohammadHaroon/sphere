import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMilestone,
  createMilestone,
  deleteMilestone,
  listMilestones,
  updateMilestone,
} from "@/lib/milestonesApi";
import { useAuth } from "@/hooks/useAuth";

function useOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

export function useProjectMilestones(projectId) {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["milestones", user?.organizationId, projectId],
    queryFn: async () => {
      const result = await listMilestones(projectId);
      return result.milestones;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

function invalidateMilestoneQueries(queryClient, user, projectId) {
  queryClient.invalidateQueries({
    queryKey: ["milestones", user?.organizationId],
  });
  queryClient.invalidateQueries({
    queryKey: ["calendar", user?.organizationId, projectId],
  });
}

export function useCreateMilestone(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data) => createMilestone(projectId, data),
    onSuccess: () => {
      invalidateMilestoneQueries(queryClient, user, projectId);
    },
  });
}

export function useUpdateMilestone(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }) => updateMilestone(id, data),
    onSuccess: () => {
      invalidateMilestoneQueries(queryClient, user, projectId);
    },
  });
}

export function useDeleteMilestone(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id) => deleteMilestone(id),
    onSuccess: () => {
      invalidateMilestoneQueries(queryClient, user, projectId);
    },
  });
}

export function useApproveMilestone() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, decision }) => approveMilestone(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestones", user?.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["calendar", user?.organizationId],
      });
    },
  });
}

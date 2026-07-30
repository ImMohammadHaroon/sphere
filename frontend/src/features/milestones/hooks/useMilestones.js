import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMilestone,
  createMilestone,
  deleteMilestone,
  listMilestones,
  submitMilestoneFeedback,
  updateMilestone,
  replyMilestoneFeedback,
} from "@/lib/milestonesApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

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

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (data) => createMilestone(projectId, data),
        onSuccess: () => {
          invalidateMilestoneQueries(queryClient, user, projectId);
        },
      },
      { success: "Milestone created." }
    )
  );
}

export function useUpdateMilestone(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, data }) => updateMilestone(id, data),
        onSuccess: () => {
          invalidateMilestoneQueries(queryClient, user, projectId);
        },
      },
      { success: "Milestone updated." }
    )
  );
}

export function useDeleteMilestone(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (id) => deleteMilestone(id),
        onSuccess: () => {
          invalidateMilestoneQueries(queryClient, user, projectId);
        },
      },
      { success: "Milestone deleted." }
    )
  );
}

export function useApproveMilestone() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, decision, rejectReason }) =>
          approveMilestone(id, decision, rejectReason),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["milestones", user?.organizationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["calendar", user?.organizationId],
          });
        },
      },
      {
        success: (_result, { decision }) =>
          decision === "approved"
            ? "Milestone approved."
            : "Milestone rejected.",
      }
    )
  );
}

export function useSubmitMilestoneFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, feedback }) => submitMilestoneFeedback(id, feedback),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["milestones", user?.organizationId],
          });
        },
      },
      { success: "Feedback sent to the team." }
    )
  );
}

export function useReplyMilestoneFeedback() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, message }) => replyMilestoneFeedback(id, message),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["milestones", user?.organizationId],
          });
        },
      },
      { success: "Reply sent to the client." }
    )
  );
}

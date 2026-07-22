import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteMilestoneAttachment,
  getMilestoneAttachments,
  uploadMilestoneAttachment,
} from "@/lib/milestoneAttachmentsApi";
import { useAuth } from "@/hooks/useAuth";

function useOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

export function useMilestoneAttachments(milestoneId) {
  const { isAuthenticated, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["milestone-attachments", milestoneId],
    queryFn: async () => {
      const result = await getMilestoneAttachments(milestoneId);
      return result.attachments ?? [];
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!milestoneId,
  });
}

export function useUploadMilestoneAttachment(milestoneId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => uploadMilestoneAttachment(milestoneId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestone-attachments", milestoneId],
      });
    },
  });
}

export function useDeleteMilestoneAttachment(milestoneId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId) =>
      deleteMilestoneAttachment(milestoneId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["milestone-attachments", milestoneId],
      });
    },
  });
}

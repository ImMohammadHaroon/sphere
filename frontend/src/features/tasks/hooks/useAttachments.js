import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAttachment,
  getAttachments,
  uploadAttachment,
} from "@/lib/attachmentsApi";
import { useTaskOrgContext } from "./useTaskOrgContext";

export function useAttachments(taskId) {
  const { isAuthenticated, user, hasOrg } = useTaskOrgContext();

  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const result = await getAttachments(taskId);
      return result.attachments ?? [];
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!taskId,
  });
}

export function useUploadAttachment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => uploadAttachment(taskId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });
}

export function useDeleteAttachment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId) => deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createComment,
  deleteComment,
  getComments,
} from "@/lib/commentsApi";
import { useTaskOrgContext } from "./useTaskOrgContext";

export function useComments(taskId) {
  const { isAuthenticated, user, hasOrg } = useTaskOrgContext();

  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const result = await getComments(taskId);
      return result.comments ?? [];
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!taskId,
  });
}

export function useCreateComment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body) => createComment(taskId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

export function useDeleteComment(taskId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId) => deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

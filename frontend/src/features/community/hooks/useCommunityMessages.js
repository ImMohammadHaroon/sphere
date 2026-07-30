import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCommunityMessage,
  deleteCommunityMessage,
  getCommunityMessages,
} from "@/lib/communityApi";
import { withMutationToasts } from "@/lib/mutationToasts";
import { useAuth } from "@/hooks/useAuth";

const COMMUNITY_MESSAGES_KEY = ["communityMessages"];

export function useCommunityMessages() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = Boolean(user?.organizationId);

  return useQuery({
    queryKey: COMMUNITY_MESSAGES_KEY,
    queryFn: async () => {
      const result = await getCommunityMessages({ limit: 50 });
      return {
        messages: result.messages ?? [],
        hasMore: result.hasMore ?? false,
      };
    },
    staleTime: 10_000,
    enabled: isAuthenticated && hasOrg,
  });
}

export function useLoadMoreCommunityMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (before) => {
      const result = await getCommunityMessages({ limit: 50, before });
      return {
        messages: result.messages ?? [],
        hasMore: result.hasMore ?? false,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(COMMUNITY_MESSAGES_KEY, (old) => {
        if (!old) return data;
        const existingIds = new Set(old.messages.map((m) => m._id));
        const older = data.messages.filter((m) => !existingIds.has(m._id));
        return {
          messages: [...older, ...old.messages],
          hasMore: data.hasMore,
        };
      });
    },
  });
}

export function useCreateCommunityMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (body) => createCommunityMessage(body),
        onSuccess: (data) => {
          const newMessage = data.message;
          if (!newMessage) return;

          queryClient.setQueryData(COMMUNITY_MESSAGES_KEY, (old) => {
            if (!old) {
              return { messages: [newMessage], hasMore: false };
            }
            const exists = old.messages.some((m) => m._id === newMessage._id);
            if (exists) return old;
            return {
              ...old,
              messages: [...old.messages, newMessage],
            };
          });
        },
      },
      { success: "Message sent." }
    )
  );
}

export function useDeleteCommunityMessage() {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (messageId) => deleteCommunityMessage(messageId),
        onSuccess: (_, messageId) => {
          queryClient.setQueryData(COMMUNITY_MESSAGES_KEY, (old) => {
            if (!old) return old;
            return {
              ...old,
              messages: old.messages.filter((m) => m._id !== messageId),
            };
          });
        },
      },
      { success: "Message deleted." }
    )
  );
}

export { COMMUNITY_MESSAGES_KEY };

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRoomMessage,
  deleteRoomMessage,
  getRoomMessages,
} from "@/lib/chatApi";
import { withMutationToasts } from "@/lib/mutationToasts";
import { useAuth } from "@/hooks/useAuth";
import { CHAT_ROOMS_KEY } from "./useChatRooms";

export function chatMessagesKey(roomId) {
  return ["chatMessages", roomId];
}

export function useChatMessages(roomId) {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = Boolean(user?.organizationId);

  return useQuery({
    queryKey: chatMessagesKey(roomId),
    queryFn: async () => {
      const result = await getRoomMessages(roomId, { limit: 50 });
      return {
        messages: result.messages ?? [],
        hasMore: result.hasMore ?? false,
      };
    },
    staleTime: 10_000,
    enabled: isAuthenticated && hasOrg && !!roomId,
  });
}

export function useLoadMoreChatMessages(roomId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (before) => {
      const result = await getRoomMessages(roomId, { limit: 50, before });
      return {
        messages: result.messages ?? [],
        hasMore: result.hasMore ?? false,
      };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(chatMessagesKey(roomId), (old) => {
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

export function useCreateChatMessage(roomId) {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (body) => createRoomMessage(roomId, body),
        onSuccess: (data) => {
          const newMessage = data.message;
          if (!newMessage) return;

          queryClient.setQueryData(chatMessagesKey(roomId), (old) => {
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
          queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
        },
      },
      { success: "Message sent." }
    )
  );
}

export function useDeleteChatMessage(roomId) {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (messageId) => deleteRoomMessage(roomId, messageId),
        onSuccess: (_, messageId) => {
          queryClient.setQueryData(chatMessagesKey(roomId), (old) => {
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

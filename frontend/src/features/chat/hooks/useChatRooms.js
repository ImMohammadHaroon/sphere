import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDirectRoom,
  getChatRoom,
  listChatRooms,
  searchChatDirectory,
} from "@/lib/chatApi";
import { withMutationToasts } from "@/lib/mutationToasts";
import { useAuth } from "@/hooks/useAuth";

export const CHAT_ROOMS_KEY = ["chatRooms"];

export function useChatRooms() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = Boolean(user?.organizationId);

  return useQuery({
    queryKey: CHAT_ROOMS_KEY,
    queryFn: async () => {
      const result = await listChatRooms();
      return result.rooms ?? { community: null, projects: [], direct: [] };
    },
    staleTime: 15_000,
    enabled: isAuthenticated && hasOrg,
  });
}

export function useChatDirectory(query) {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = Boolean(user?.organizationId);
  const trimmed = query?.trim() ?? "";

  return useQuery({
    queryKey: ["chatDirectory", trimmed],
    queryFn: async () => {
      const result = await searchChatDirectory(trimmed);
      return result.users ?? [];
    },
    staleTime: 10_000,
    enabled: isAuthenticated && hasOrg && trimmed.length > 0,
  });
}

export function useChatRoom(roomId) {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = Boolean(user?.organizationId);

  return useQuery({
    queryKey: ["chatRoom", roomId],
    queryFn: async () => {
      const result = await getChatRoom(roomId);
      return result.room;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!roomId,
  });
}

export function useCreateDirectRoom() {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (userId) => createDirectRoom(userId),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
        },
      },
      { success: "Direct chat opened." }
    )
  );
}

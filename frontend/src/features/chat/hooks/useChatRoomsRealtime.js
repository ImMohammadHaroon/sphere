import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgSocket } from "@/hooks/useOrgSocket";
import { CHAT_ROOMS_KEY } from "@/features/chat/hooks/useChatRooms";

export function useChatRoomsRealtime() {
  const queryClient = useQueryClient();
  const socket = useOrgSocket();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;

    function refreshRooms() {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
      }, 800);
    }

    socket.on("chat:room:updated", refreshRooms);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      socket.off("chat:room:updated", refreshRooms);
    };
  }, [socket, queryClient]);
}

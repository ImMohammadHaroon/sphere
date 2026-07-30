import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrgSocket } from "@/hooks/useOrgSocket";
import { COMMUNITY_MESSAGES_KEY } from "./useCommunityMessages";

export function useCommunitySocket() {
  const queryClient = useQueryClient();
  const socket = useOrgSocket();

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    function onMessageNew(message) {
      if (!message?._id) return;

      queryClient.setQueryData(COMMUNITY_MESSAGES_KEY, (old) => {
        if (!old) {
          return { messages: [message], hasMore: false };
        }
        const exists = old.messages.some((m) => m._id === message._id);
        if (exists) {
          return {
            ...old,
            messages: old.messages.map((m) =>
              m._id === message._id ? message : m
            ),
          };
        }
        return {
          ...old,
          messages: [...old.messages, message],
        };
      });
    }

    function onMessageDeleted({ messageId }) {
      if (!messageId) return;

      queryClient.setQueryData(COMMUNITY_MESSAGES_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.filter((m) => m._id !== messageId),
        };
      });
    }

    function onAttachmentNew({ messageId, message }) {
      if (message) {
        onMessageNew(message);
        return;
      }
      if (!messageId) return;
      queryClient.invalidateQueries({ queryKey: COMMUNITY_MESSAGES_KEY });
    }

    function onAttachmentDeleted({ messageId }) {
      if (!messageId) return;
      queryClient.invalidateQueries({ queryKey: COMMUNITY_MESSAGES_KEY });
    }

    socket.on("community:message:new", onMessageNew);
    socket.on("community:message:deleted", onMessageDeleted);
    socket.on("community:attachment:new", onAttachmentNew);
    socket.on("community:attachment:deleted", onAttachmentDeleted);

    return () => {
      socket.off("community:message:new", onMessageNew);
      socket.off("community:message:deleted", onMessageDeleted);
      socket.off("community:attachment:new", onAttachmentNew);
      socket.off("community:attachment:deleted", onAttachmentDeleted);
    };
  }, [socket, queryClient]);
}

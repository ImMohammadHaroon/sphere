import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatSocket } from "./useChatSocket";
import { chatMessagesKey } from "./useChatMessages";
import { CHAT_ROOMS_KEY } from "./useChatRooms";

export function useChatRealtime(roomId) {
  const queryClient = useQueryClient();
  const socket = useChatSocket(roomId);

  useEffect(() => {
    if (!socket || !roomId) {
      return undefined;
    }

    function onMessageNew(payload) {
      if (payload?.roomId !== roomId) return;
      const message = payload?.message;
      if (!message?._id) return;

      queryClient.setQueryData(chatMessagesKey(roomId), (old) => {
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
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    }

    function onMessageDeleted(payload) {
      if (payload?.roomId !== roomId || !payload?.messageId) return;
      queryClient.setQueryData(chatMessagesKey(roomId), (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: old.messages.filter((m) => m._id !== payload.messageId),
        };
      });
    }

    function onAttachmentNew(payload) {
      if (payload?.roomId !== roomId) return;
      if (payload?.message) {
        onMessageNew({ roomId, message: payload.message });
        return;
      }
      queryClient.invalidateQueries({ queryKey: chatMessagesKey(roomId) });
      queryClient.invalidateQueries({ queryKey: CHAT_ROOMS_KEY });
    }

    function onAttachmentDeleted(payload) {
      if (payload?.roomId !== roomId) return;
      queryClient.invalidateQueries({ queryKey: chatMessagesKey(roomId) });
    }

    socket.on("chat:message:new", onMessageNew);
    socket.on("chat:message:deleted", onMessageDeleted);
    socket.on("chat:attachment:new", onAttachmentNew);
    socket.on("chat:attachment:deleted", onAttachmentDeleted);

    return () => {
      socket.off("chat:message:new", onMessageNew);
      socket.off("chat:message:deleted", onMessageDeleted);
      socket.off("chat:attachment:new", onAttachmentNew);
      socket.off("chat:attachment:deleted", onAttachmentDeleted);
    };
  }, [socket, roomId, queryClient]);
}

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";

export function useTaskCollaborationSocket(projectId, taskId) {
  const queryClient = useQueryClient();
  const socket = useSocket(projectId);

  useEffect(() => {
    if (!socket || !taskId) {
      return undefined;
    }

    function invalidateComments(payload) {
      if (payload?.taskId && payload.taskId !== taskId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    }

    function invalidateAttachments(payload) {
      if (payload?.taskId && payload.taskId !== taskId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    }

    function onCommentNew(comment) {
      if (comment?.taskId && comment.taskId !== taskId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    }

    function onAttachmentNew(attachment) {
      if (attachment?.taskId && attachment.taskId !== taskId) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
    }

    socket.on("comment:new", onCommentNew);
    socket.on("comment:deleted", invalidateComments);
    socket.on("attachment:new", onAttachmentNew);
    socket.on("attachment:deleted", invalidateAttachments);

    return () => {
      socket.off("comment:new", onCommentNew);
      socket.off("comment:deleted", invalidateComments);
      socket.off("attachment:new", onAttachmentNew);
      socket.off("attachment:deleted", invalidateAttachments);
    };
  }, [socket, taskId, queryClient]);
}

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSocket } from "@/lib/socket";

export function useChatSocket(roomId) {
  const { accessToken, user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const hasOrg = Boolean(user?.organizationId);

  useEffect(() => {
    if (!accessToken || !hasOrg || !roomId) {
      return undefined;
    }

    const instance = createSocket(accessToken);
    if (!instance) {
      return undefined;
    }

    socketRef.current = instance;

    function joinRoom() {
      instance.emit("chat:join", { roomId });
    }

    instance.on("connect", joinRoom);
    instance.connect();
    setSocket(instance);

    return () => {
      instance.emit("chat:leave", { roomId });
      instance.off("connect", joinRoom);
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, hasOrg, roomId]);

  return socket;
}

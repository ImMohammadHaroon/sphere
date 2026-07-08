import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSocket } from "@/lib/socket";

export function useSocket(projectId) {
  const { accessToken } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!accessToken || !projectId) {
      return undefined;
    }

    const instance = createSocket(accessToken);
    socketRef.current = instance;

    function joinProject() {
      instance.emit("project:join", { projectId });
    }

    instance.on("connect", joinProject);
    instance.connect();
    setSocket(instance);

    return () => {
      instance.emit("project:leave", { projectId });
      instance.off("connect", joinProject);
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, projectId]);

  return socket;
}

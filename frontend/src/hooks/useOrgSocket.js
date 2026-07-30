import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSocket } from "@/lib/socket";

export function useOrgSocket() {
  const { accessToken, user } = useAuth();
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  const hasOrg = Boolean(user?.organizationId);

  useEffect(() => {
    if (!accessToken || !hasOrg) {
      return undefined;
    }

    const instance = createSocket(accessToken);
    if (!instance) {
      return undefined;
    }

    socketRef.current = instance;
    instance.connect();
    setSocket(instance);

    return () => {
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [accessToken, hasOrg]);

  return socket;
}

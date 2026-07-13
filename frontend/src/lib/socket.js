import { io } from "socket.io-client";
import { areSocketsEnabled, resolveSocketUrl } from "@/lib/backendUrl";

export function createSocket(accessToken) {
  if (!areSocketsEnabled()) {
    return null;
  }

  return io(resolveSocketUrl(), {
    autoConnect: false,
    auth: { token: accessToken },
  });
}

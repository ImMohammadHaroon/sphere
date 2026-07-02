import { useAuthStore } from "@/store/authStore";

const CHANNEL_NAME = "projectsphere-auth";

let authChannel = null;

export function initAuthChannel() {
  if (typeof BroadcastChannel === "undefined") return;

  authChannel = new BroadcastChannel(CHANNEL_NAME);

  authChannel.onmessage = (event) => {
    if (event.data.type === "LOGIN") {
      useAuthStore.getState().setUser(event.data.user);
    }

    if (event.data.type === "LOGOUT") {
      useAuthStore.getState().clearSession();
      window.location.href = "/login";
    }
  };
}

export function broadcastLogin(user) {
  authChannel?.postMessage({ type: "LOGIN", user });
}

export function broadcastLogout() {
  authChannel?.postMessage({ type: "LOGOUT" });
}

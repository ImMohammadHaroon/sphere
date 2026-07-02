import { useAuthStore } from "@/store/authStore";
import { broadcastLogin, broadcastLogout, initAuthChannel } from "./authChannel";

let channelInitialized = false;

export function initCrossTabAuth() {
  if (channelInitialized) return;
  channelInitialized = true;
  initAuthChannel();

  window.addEventListener("storage", (event) => {
    if (event.key !== "authState") return;

    if (event.newValue === "active") {
      return;
    }

    if (event.newValue === null) {
      useAuthStore.getState().clearSession();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  });
}

export function syncLogin(accessToken, user) {
  useAuthStore.getState().setSession(accessToken, user);
  broadcastLogin(user);
}

export function syncLogout() {
  useAuthStore.getState().clearSession();
  broadcastLogout();
}

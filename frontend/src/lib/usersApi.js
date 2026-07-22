import { getAccessToken } from "./apiClient";
import { resolveApiBaseUrl } from "./backendUrl";

const API_URL = resolveApiBaseUrl();

const avatarBlobCache = new Map();

function cacheKey(userId, cacheBust) {
  return `${userId}:${cacheBust ?? ""}`;
}

export const usersApi = {
  getAvatarBlob: async (userId, cacheBust) => {
    const key = cacheKey(userId, cacheBust);
    const cached = avatarBlobCache.get(key);
    if (cached) {
      return cached;
    }

    const headers = {};
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const deviceId = localStorage.getItem("ps_device_id");
    if (deviceId) {
      headers["X-Device-Id"] = deviceId;
    }

    const query = cacheBust ? `?t=${encodeURIComponent(cacheBust)}` : "";
    const response = await fetch(`${API_URL}/users/${userId}/avatar${query}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to load avatar");
    }

    const blob = await response.blob();
    avatarBlobCache.set(key, blob);
    return blob;
  },

  clearAvatarCache: (userId) => {
    if (!userId) {
      avatarBlobCache.clear();
      return;
    }

    for (const key of avatarBlobCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        avatarBlobCache.delete(key);
      }
    }
  },
};

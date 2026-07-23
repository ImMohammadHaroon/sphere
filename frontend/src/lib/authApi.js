import { apiClient, ApiError, getAccessToken } from "./apiClient";
import { getDeviceId } from "./authHelpers";
import { resolveApiBaseUrl } from "./backendUrl";

const API_URL = resolveApiBaseUrl();

export const authApi = {
  registerOrg: (data) =>
    apiClient("/auth/register-org", {
      method: "POST",
      body: data,
      skipAuth: true,
    }),

  verifyOrgRegistration: (data) =>
    apiClient("/auth/verify-org-registration", {
      method: "POST",
      body: { ...data, deviceId: getDeviceId() },
      skipAuth: true,
      headers: { "X-Device-Id": getDeviceId() },
    }),

  resendOrgVerification: (email) =>
    apiClient("/auth/resend-org-verification", {
      method: "POST",
      body: { email },
      skipAuth: true,
    }),

  login: (data) =>
    apiClient("/auth/login", {
      method: "POST",
      body: { ...data, deviceId: getDeviceId() },
      skipAuth: true,
    }),

  refresh: () =>
    apiClient("/auth/refresh", {
      method: "POST",
      skipAuth: true,
    }),

  logout: () =>
    apiClient("/auth/logout", { method: "POST" }),

  logoutAll: () =>
    apiClient("/auth/logout-all", { method: "POST" }),

  me: () => apiClient("/auth/me"),

  updateProfile: (data) =>
    apiClient("/auth/profile", { method: "PATCH", body: data }),

  changePassword: (data) =>
    apiClient("/auth/change-password", { method: "POST", body: data }),

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const headers = {};
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const deviceId = localStorage.getItem("ps_device_id");
    if (deviceId) {
      headers["X-Device-Id"] = deviceId;
    }

    const response = await fetch(`${API_URL}/auth/avatar`, {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        typeof data.message === "string" ? data.message : "Upload failed";
      throw new ApiError(message, response.status);
    }

    return data;
  },

  getAvatarBlob: async (cacheBust) => {
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
    const response = await fetch(`${API_URL}/auth/avatar${query}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message =
        typeof data.message === "string" ? data.message : "Failed to load avatar";
      throw new ApiError(message, response.status);
    }

    return response.blob();
  },

  deleteAvatar: () => apiClient("/auth/avatar", { method: "DELETE" }),

  forgotPassword: (email) =>
    apiClient("/auth/forgot-password", {
      method: "POST",
      body: { email },
      skipAuth: true,
    }),

  resetPassword: (data) =>
    apiClient("/auth/reset-password", {
      method: "POST",
      body: data,
      skipAuth: true,
    }),
};

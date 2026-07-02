import { apiClient } from "./apiClient";
import { getDeviceId } from "./authHelpers";

export const authApi = {
  registerOrg: (data) =>
    apiClient("/auth/register-org", {
      method: "POST",
      body: data,
      skipAuth: true,
      headers: { "X-Device-Id": getDeviceId() },
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

  acceptInvite: (data) =>
    apiClient("/auth/accept-invite", {
      method: "POST",
      body: { ...data, deviceId: getDeviceId() },
      skipAuth: true,
    }),

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

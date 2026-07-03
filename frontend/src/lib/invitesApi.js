import { apiClient } from "./apiClient";
import { getDeviceId } from "./authHelpers";

export const invitesApi = {
  createInvite: (data) =>
    apiClient("/invites", {
      method: "POST",
      body: data,
    }),

  getInviteByToken: (token) =>
    apiClient(`/invites/${encodeURIComponent(token)}`, {
      skipAuth: true,
    }),

  acceptInvite: ({ token, name, password }) =>
    apiClient(`/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      body: { name, password, deviceId: getDeviceId() },
      skipAuth: true,
      headers: { "X-Device-Id": getDeviceId() },
    }),

  listInvites: () => apiClient("/invites"),

  revokeInvite: (id) =>
    apiClient(`/invites/${id}`, { method: "DELETE" }),
};

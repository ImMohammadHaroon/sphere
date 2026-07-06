import { apiClient } from "./apiClient";

export function getSettings() {
  return apiClient("/org/settings");
}

export function updateGeneralSettings(data) {
  return apiClient("/org/settings/general", {
    method: "PATCH",
    body: data,
  });
}

export function updateSecuritySettings(data) {
  return apiClient("/org/settings/security", {
    method: "PATCH",
    body: data,
  });
}

export function updateInvitePolicy(data) {
  return apiClient("/org/settings/invite-policy", {
    method: "PATCH",
    body: data,
  });
}

export function deactivateOrg(confirmSlug) {
  return apiClient("/org/settings/deactivate", {
    method: "PATCH",
    body: { confirmSlug },
  });
}

export function deleteOrg(confirmSlug) {
  return apiClient("/org/settings/delete", {
    method: "DELETE",
    body: { confirmSlug },
  });
}

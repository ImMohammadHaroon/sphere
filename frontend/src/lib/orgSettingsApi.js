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

export function deleteOrg(confirmSlug) {
  return apiClient("/org/settings/delete", {
    method: "DELETE",
    body: { confirmSlug },
  });
}

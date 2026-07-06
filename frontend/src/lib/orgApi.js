import { apiClient } from "./apiClient";

export function listOrgUsers() {
  return apiClient("/org/users");
}

export function getOrgUser(id) {
  return apiClient(`/org/users/${id}`);
}

export function removeOrgUser(id) {
  return apiClient(`/org/users/${id}`, { method: "DELETE" });
}

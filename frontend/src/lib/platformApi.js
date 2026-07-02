import { apiClient } from "@/lib/apiClient";

export function getPlatformOverview() {
  return apiClient("/platform/reports/overview");
}

export function listOrganizations() {
  return apiClient("/platform/organizations");
}

export function getOrganization(id) {
  return apiClient(`/platform/organizations/${id}`);
}

import { apiClient } from "@/lib/apiClient";

export function getBurndownReport(projectId) {
  return apiClient(`/projects/${projectId}/reports/burndown`);
}

export function getVelocityReport(projectId) {
  return apiClient(`/projects/${projectId}/reports/velocity`);
}

export function getWorkloadReport(projectId) {
  return apiClient(`/projects/${projectId}/reports/workload`);
}

export function getOrgReportsOverview() {
  return apiClient("/org/reports/overview");
}

export function getPlatformReportsOverview() {
  return apiClient("/platform/reports/overview");
}

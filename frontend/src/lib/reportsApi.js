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

function buildPlatformProjectsQuery(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.search) {
    searchParams.set("search", params.search);
  }

  if (params.organizationId) {
    searchParams.set("organizationId", params.organizationId);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getPlatformProjects(params = {}) {
  return apiClient(`/platform/projects${buildPlatformProjectsQuery(params)}`);
}

export function getPlatformBurndownReport(projectId) {
  return apiClient(`/platform/projects/${projectId}/reports/burndown`);
}

export function getPlatformVelocityReport(projectId) {
  return apiClient(`/platform/projects/${projectId}/reports/velocity`);
}

export function getPlatformWorkloadReport(projectId) {
  return apiClient(`/platform/projects/${projectId}/reports/workload`);
}

export function getOrgReportsOverview() {
  return apiClient("/org/reports/overview");
}

export function getPlatformReportsOverview() {
  return apiClient("/platform/reports/overview");
}

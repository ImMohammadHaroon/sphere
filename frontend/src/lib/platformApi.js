import { apiClient } from "@/lib/apiClient";

export function getPlatformOverview() {
  return apiClient("/platform/reports/overview");
}

function buildOrganizationsQuery(params = {}) {
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

  if (params.plan) {
    searchParams.set("plan", params.plan);
  }

  if (params.isActive === true || params.isActive === false) {
    searchParams.set("isActive", String(params.isActive));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listOrganizations(params = {}) {
  return apiClient(`/platform/organizations${buildOrganizationsQuery(params)}`);
}

export function getOrganizationDetail(id) {
  return apiClient(`/platform/organizations/${id}`);
}

export function suspendOrganization(id) {
  return apiClient(`/platform/organizations/${id}/suspend`, { method: "PATCH" });
}

export function activateOrganization(id) {
  return apiClient(`/platform/organizations/${id}/activate`, { method: "PATCH" });
}

export function deleteOrganization(id, confirmSlug) {
  return apiClient(`/platform/organizations/${id}`, {
    method: "DELETE",
    body: { confirmSlug },
  });
}

function buildUsersQuery(params = {}) {
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

  if (params.role) {
    searchParams.set("role", params.role);
  }

  if (params.organizationId) {
    searchParams.set("organizationId", params.organizationId);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listAllUsers(params = {}) {
  return apiClient(`/platform/users${buildUsersQuery(params)}`);
}

function buildAuditLogsQuery(params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("limit", String(params.limit ?? 10));

  if (params.action) {
    searchParams.set("action", params.action);
  }

  if (params.organizationId) {
    searchParams.set("organizationId", params.organizationId);
  }

  if (params.startDate) {
    searchParams.set("startDate", params.startDate);
  }

  if (params.endDate) {
    searchParams.set("endDate", params.endDate);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listPlatformAuditLogs(params = {}) {
  return apiClient(`/platform/audit-logs${buildAuditLogsQuery(params)}`);
}

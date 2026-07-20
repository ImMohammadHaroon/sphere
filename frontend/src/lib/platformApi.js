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

  if (params.isActive === true || params.isActive === false) {
    searchParams.set("isActive", String(params.isActive));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listOrganizations(params = {}) {
  return apiClient(`/platform/organizations${buildOrganizationsQuery(params)}`);
}

function buildPendingOrganizationsQuery(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.set("page", String(params.page));
  }

  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listPendingOrganizations(params = {}) {
  return apiClient(
    `/platform/organizations/pending${buildPendingOrganizationsQuery(params)}`
  );
}

export function approveOrganization(id) {
  return apiClient(`/platform/organizations/${id}/approve`, { method: "PATCH" });
}

export function rejectOrganization(id, reason) {
  return apiClient(`/platform/organizations/${id}/reject`, {
    method: "PATCH",
    body: reason ? { reason } : {},
  });
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

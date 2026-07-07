import { apiClient } from "@/lib/apiClient";

export function listProjects() {
  return apiClient("/projects");
}

export function createProject(data) {
  return apiClient("/projects", { method: "POST", body: data });
}

export function getProject(id) {
  return apiClient(`/projects/${id}`);
}

export function updateProject(id, data) {
  return apiClient(`/projects/${id}`, { method: "PATCH", body: data });
}

export function archiveProject(id) {
  return apiClient(`/projects/${id}`, { method: "DELETE" });
}

export function addMember(id, userId) {
  return apiClient(`/projects/${id}/members`, {
    method: "PATCH",
    body: { userId },
  });
}

export function removeMember(id, userId) {
  return apiClient(`/projects/${id}/members/remove`, {
    method: "PATCH",
    body: { userId },
  });
}

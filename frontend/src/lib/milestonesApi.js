import { apiClient } from "@/lib/apiClient";

export function listMilestones(projectId) {
  return apiClient(`/projects/${projectId}/milestones`);
}

export function createMilestone(projectId, data) {
  return apiClient(`/projects/${projectId}/milestones`, {
    method: "POST",
    body: data,
  });
}

export function updateMilestone(id, data) {
  return apiClient(`/milestones/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export function approveMilestone(id, decision) {
  return apiClient(`/milestones/${id}/approve`, {
    method: "PATCH",
    body: { decision },
  });
}

export function deleteMilestone(id) {
  return apiClient(`/milestones/${id}`, {
    method: "DELETE",
  });
}

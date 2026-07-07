import { apiClient } from "@/lib/apiClient";

export function listMyTasks() {
  return apiClient("/tasks/mine");
}

export function listProjectTasks(projectId) {
  return apiClient(`/projects/${projectId}/tasks`);
}

export function createTask(projectId, data) {
  return apiClient(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: data,
  });
}

export function getTask(id) {
  return apiClient(`/tasks/${id}`);
}

export function updateTask(id, data) {
  return apiClient(`/tasks/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export function getProjectMembers(projectId) {
  return apiClient(`/projects/${projectId}/members`);
}

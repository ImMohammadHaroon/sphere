import { apiClient } from "@/lib/apiClient";

export function getComments(taskId) {
  return apiClient(`/tasks/${taskId}/comments`);
}

export function createComment(taskId, body) {
  return apiClient(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: { body },
  });
}

export function deleteComment(taskId, commentId) {
  return apiClient(`/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

import { apiClient } from "@/lib/apiClient";

export function getComments(taskId) {
  return apiClient(`/tasks/${taskId}/comments`);
}

export function createComment(taskId, { body, parentId = null }) {
  return apiClient(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: {
      body,
      ...(parentId ? { parentId } : {}),
    },
  });
}

export function deleteComment(taskId, commentId) {
  return apiClient(`/tasks/${taskId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

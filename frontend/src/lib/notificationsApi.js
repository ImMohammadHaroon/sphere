import { apiClient } from "@/lib/apiClient";

export function listNotifications(page = 1) {
  return apiClient(`/notifications?page=${page}`);
}

export function markNotificationRead(id) {
  return apiClient(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead() {
  return apiClient("/notifications/read-all", {
    method: "PATCH",
  });
}

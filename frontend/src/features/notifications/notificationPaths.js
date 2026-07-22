export const NOTIFICATIONS_PATH = "/notifications";

export function getNotificationsPath() {
  return NOTIFICATIONS_PATH;
}

export function getTaskDetailPath(role, payload) {
  if (role === "team_member") {
    return `/member/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  if (role === "project_manager") {
    return `/dashboard/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  return getNotificationsPath();
}

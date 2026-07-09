export function getNotificationsPath(role) {
  const map = {
    super_admin: "/super-admin/notifications",
    org_admin: "/admin/notifications",
    project_manager: "/dashboard/notifications",
    team_member: "/member/notifications",
    client: "/portal/notifications",
  };
  return map[role] ?? "/";
}

export function getTaskDetailPath(role, payload) {
  if (role === "team_member") {
    return `/member/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  if (role === "project_manager") {
    return `/dashboard/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  return getNotificationsPath(role);
}

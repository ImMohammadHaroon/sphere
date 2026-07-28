import { getDashboardPath } from "@/lib/authHelpers";

export const NOTIFICATIONS_PATH = "/notifications";

export function getNotificationsPath() {
  return NOTIFICATIONS_PATH;
}

export function getTaskDetailPath(role, payload) {
  if (role === "team_member") {
    return `/member/projects/${payload.projectId}/board?task=${payload.taskId}`;
  }
  if (role === "project_manager") {
    return `/dashboard/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  if (role === "org_admin") {
    return `/admin/projects/${payload.projectId}/tasks/${payload.taskId}`;
  }
  return getNotificationsPath();
}

export function getMilestoneDetailPath(role, payload) {
  if (role === "client") {
    return "/portal/milestones";
  }
  if (role === "project_manager") {
    return `/dashboard/projects/${payload.projectId}/milestones?highlight=${payload.milestoneId}`;
  }
  if (role === "org_admin") {
    return `/admin/projects/${payload.projectId}`;
  }
  return getNotificationsPath();
}

export function getNotificationPath(role, notification) {
  const { type, payload } = notification;

  if (type === "task_assigned" || type === "task_moved") {
    return getTaskDetailPath(role, payload);
  }
  if (type === "milestone_created" || type === "milestone_approved") {
    return getMilestoneDetailPath(role, payload);
  }
  if (type === "invite_accepted") {
    if (role === "org_admin") {
      return "/admin/users";
    }
    return getDashboardPath(role) ?? getNotificationsPath();
  }
  if (type === "org_registered" && role === "super_admin" && payload.organizationId) {
    return `/super-admin/organizations/${payload.organizationId}`;
  }

  return getNotificationsPath();
}

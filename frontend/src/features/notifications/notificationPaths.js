import { getDashboardPath } from "@/lib/authHelpers";
import {
  getMilestoneDetailPath,
  getProjectTasksPath,
} from "@/lib/projectPaths";

export const NOTIFICATIONS_PATH = "/notifications";

export function getNotificationsPath() {
  return NOTIFICATIONS_PATH;
}

export function getTaskDetailPath(role, payload) {
  return getProjectTasksPath(role, payload.projectId, payload.taskId);
}

export function getMilestoneDetailPathForRole(role, payload) {
  if (role === "client") {
    return "/portal/milestones";
  }
  return getMilestoneDetailPath(role, payload.projectId, payload.milestoneId);
}

export function getNotificationPath(role, notification) {
  const { type, payload } = notification;

  if (type === "task_assigned" || type === "task_moved" || type === "comment_mention") {
    return getTaskDetailPath(role, payload);
  }
  if (type === "milestone_created" || type === "milestone_approved") {
    return getMilestoneDetailPathForRole(role, payload);
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

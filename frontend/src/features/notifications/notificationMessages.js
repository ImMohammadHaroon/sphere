export function formatNotificationMessage(notification) {
  const { type, payload = {} } = notification;

  switch (type) {
    case "task_assigned":
      return `You were assigned to ${payload.taskTitle ?? "a task"}`;
    case "task_moved":
      return `${payload.taskTitle ?? "A task"} moved to ${payload.newStatus ?? "done"}`;
    case "invite_accepted":
      return `${payload.invitedUserName ?? "Someone"} accepted their invite`;
    case "org_registered":
      return `${payload.organizationName ?? "An organization"} just registered`;
    default:
      return "New notification";
  }
}

export function isTaskNotification(type) {
  return type === "task_assigned" || type === "task_moved";
}

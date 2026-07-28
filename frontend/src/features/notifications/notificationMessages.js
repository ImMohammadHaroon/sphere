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
    case "milestone_created":
      return `New milestone "${payload.milestoneName ?? "Untitled"}" on ${payload.projectName ?? "a project"}`;
    case "milestone_approved":
      if (payload.decision === "rejected") {
        return `Milestone "${payload.milestoneName ?? "Untitled"}" was rejected for ${payload.projectName ?? "a project"}`;
      }
      return `Milestone "${payload.milestoneName ?? "Untitled"}" was approved for ${payload.projectName ?? "a project"}`;
    case "comment_mention":
      return `${payload.mentionedByName ?? "Someone"} mentioned you on ${payload.taskTitle ?? "a task"}`;
    default:
      return "New notification";
  }
}

export function isTaskNotification(type) {
  return type === "task_assigned" || type === "task_moved" || type === "comment_mention";
}

export function isMilestoneNotification(type) {
  return type === "milestone_created" || type === "milestone_approved";
}

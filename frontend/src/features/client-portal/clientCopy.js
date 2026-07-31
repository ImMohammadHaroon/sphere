export function formatClientMilestoneStatus(status) {
  switch (status) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Changes requested";
    case "pending":
      return "Needs your review";
    default:
      return "In progress";
  }
}

export function formatProjectProgress(percentComplete) {
  if (percentComplete >= 100) return "Complete";
  if (percentComplete >= 75) return "Almost done";
  if (percentComplete >= 40) return "Making good progress";
  if (percentComplete > 0) return "Getting started";
  return "Just started";
}

export function formatTaskSummary(doneTasks, totalTasks, percentComplete) {
  if (totalTasks === 0) return "Work is being planned";
  return `${percentComplete}% complete`;
}

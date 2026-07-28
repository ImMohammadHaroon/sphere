export function getProjectBasePath(role) {
  if (role === "org_admin") return "/admin/projects";
  if (role === "team_member") return "/member/projects";
  return "/dashboard/projects";
}

export function getProjectPath(role, projectId) {
  return `${getProjectBasePath(role)}/${projectId}`;
}

export function getProjectTasksPath(role, projectId, taskId) {
  if (role === "project_manager") {
    return `${getProjectPath(role, projectId)}/tasks/${taskId}`;
  }
  return `${getProjectPath(role, projectId)}?tab=tasks&task=${taskId}`;
}

export function getMilestoneDetailPath(role, projectId, milestoneId) {
  return `${getProjectPath(role, projectId)}/milestones/${milestoneId}`;
}

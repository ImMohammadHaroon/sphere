function memberUserId(member) {
  if (!member) {
    return null;
  }

  if (typeof member === "object" && member._id != null) {
    return member._id.toString();
  }

  return member.toString();
}

export function isProjectMember(project, userId) {
  const id = userId.toString();

  if (project.ownerId?.toString() === id) {
    return true;
  }

  return (project.members ?? []).some(
    (member) => memberUserId(member) === id
  );
}

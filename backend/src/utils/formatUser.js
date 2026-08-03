export const USER_PUBLIC_FIELDS =
  "name email role jobTitle isActive createdAt avatar.mimeType avatar.updatedAt";

export function formatPublicUser(user) {
  if (!user) {
    return null;
  }

  if (typeof user === "string" || user.constructor?.name === "ObjectId") {
    return { id: user.toString() };
  }

  const id = user._id?.toString?.() ?? user.id?.toString?.() ?? null;
  if (!id) {
    return null;
  }

  if (user.name === undefined) {
    return { id };
  }

  const formatted = {
    id,
    name: user.name,
    hasAvatar: Boolean(user.avatar?.mimeType),
    avatarUpdatedAt: user.avatar?.updatedAt?.toISOString?.() ?? null,
  };

  if (user.email !== undefined) {
    formatted.email = user.email;
  }

  if (user.role !== undefined) {
    formatted.role = user.role;
  }

  if (user.jobTitle !== undefined && user.role === "team_member") {
    formatted.jobTitle = user.jobTitle;
  }

  if (user.isActive !== undefined) {
    formatted.isActive = user.isActive;
  }

  if (user.createdAt !== undefined) {
    formatted.createdAt = user.createdAt;
  }

  return formatted;
}

export function formatUserDisplayRole(user) {
  const jobTitle =
    user?.role === "team_member" ? user?.jobTitle?.trim() : "";
  if (jobTitle) {
    return jobTitle;
  }

  return user?.role?.replace(/_/g, " ") ?? null;
}

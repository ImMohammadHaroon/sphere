import { format, isToday, isYesterday, isSameDay } from "date-fns";

const ROLE_LABELS = {
  org_admin: "Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
  client: "Client",
};

const ROLE_STYLES = {
  org_admin: "bg-sky-100 text-sky-700 border-sky-200/80",
  project_manager: "bg-amber-100 text-amber-800 border-amber-200/80",
  team_member: "bg-teal-50 text-teal-700 border-teal-200/80",
  client: "bg-violet-100 text-violet-700 border-violet-200/80",
};

export function getMessageAuthorId(message) {
  return message?.authorId ?? message?.author?.id ?? null;
}

export function isMessageFromUser(message, user) {
  const authorId = getMessageAuthorId(message);
  const userId = user?.id ?? user?._id;
  if (!authorId || !userId) return false;
  return String(authorId) === String(userId);
}

export function formatRoleLabel(role) {
  return ROLE_LABELS[role] ?? role?.replace(/_/g, " ") ?? "Member";
}

export function getRoleBadgeClass(role) {
  return ROLE_STYLES[role] ?? "bg-surface-raised text-text-muted border-border";
}

export function formatMessageDateLabel(date) {
  const value = new Date(date);
  if (isToday(value)) return "Today";
  if (isYesterday(value)) return "Yesterday";
  return format(value, "EEEE, MMMM d");
}

export function withinMinutes(a, b, minutes) {
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff <= minutes * 60 * 1000;
}

export function buildMessageTimeline(messages) {
  const items = [];
  let currentDateKey = null;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const prev = messages[index - 1];
    const next = messages[index + 1];
    const dateKey = format(new Date(message.createdAt), "yyyy-MM-dd");

    if (dateKey !== currentDateKey) {
      items.push({
        type: "date",
        key: `date-${dateKey}`,
        date: message.createdAt,
      });
      currentDateKey = dateKey;
    }

    const groupedWithPrev =
      prev &&
      getMessageAuthorId(prev) === getMessageAuthorId(message) &&
      isSameDay(new Date(prev.createdAt), new Date(message.createdAt)) &&
      withinMinutes(prev.createdAt, message.createdAt, 8);

    const groupedWithNext =
      next &&
      getMessageAuthorId(next) === getMessageAuthorId(message) &&
      isSameDay(new Date(message.createdAt), new Date(next.createdAt)) &&
      withinMinutes(message.createdAt, next.createdAt, 8);

    items.push({
      type: "message",
      key: message._id,
      message,
      isFirstInGroup: !groupedWithPrev,
      isLastInGroup: !groupedWithNext,
    });
  }

  return items;
}

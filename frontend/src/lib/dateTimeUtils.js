import { formatDistanceToNow } from "date-fns";

export function formatTimestamp(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatRelativeWithTimestamp(value) {
  if (!value) return "";
  const date = new Date(value);
  const relative = formatDistanceToNow(date, { addSuffix: true });
  return `${relative} · ${formatTimestamp(value)}`;
}

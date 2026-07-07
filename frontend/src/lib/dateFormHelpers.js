export function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function dateInputToIso(value) {
  if (!value) return null;
  return new Date(`${value}T00:00:00`).toISOString();
}

import { apiClient } from "./apiClient";

export function listAuditLogs({ page = 1, limit = 10, action, startDate, endDate } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (action) {
    params.set("action", action);
  }
  if (startDate) {
    params.set("startDate", startDate);
  }
  if (endDate) {
    params.set("endDate", endDate);
  }

  return apiClient(`/org/audit-logs?${params.toString()}`);
}

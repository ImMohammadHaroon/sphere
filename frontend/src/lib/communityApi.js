import { apiClient } from "@/lib/apiClient";

export function getCommunityMessages({ limit = 50, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (before) params.set("before", before);

  const query = params.toString();
  return apiClient(`/community/messages${query ? `?${query}` : ""}`);
}

export function createCommunityMessage(body) {
  return apiClient("/community/messages", {
    method: "POST",
    body: { body },
  });
}

export function deleteCommunityMessage(messageId) {
  return apiClient(`/community/messages/${messageId}`, {
    method: "DELETE",
  });
}

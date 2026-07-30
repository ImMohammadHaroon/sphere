import { apiClient } from "@/lib/apiClient";

export function listChatRooms() {
  return apiClient("/chat/rooms");
}

export function searchChatDirectory(q, limit = 20) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (limit) params.set("limit", String(limit));
  const query = params.toString();
  return apiClient(`/chat/directory${query ? `?${query}` : ""}`);
}

export function createDirectRoom(userId) {
  return apiClient("/chat/rooms/direct", {
    method: "POST",
    body: { userId },
  });
}

export function getChatRoom(roomId) {
  return apiClient(`/chat/rooms/${roomId}`);
}

export function getCommunityRoom() {
  return apiClient("/chat/rooms/community");
}

export function getProjectRoom(projectId) {
  return apiClient(`/chat/rooms/project/${projectId}`);
}

export function getRoomMessages(roomId, { limit = 50, before } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (before) params.set("before", before);
  const query = params.toString();
  return apiClient(`/chat/rooms/${roomId}/messages${query ? `?${query}` : ""}`);
}

export function createRoomMessage(roomId, body) {
  return apiClient(`/chat/rooms/${roomId}/messages`, {
    method: "POST",
    body: { body },
  });
}

export function deleteRoomMessage(roomId, messageId) {
  return apiClient(`/chat/rooms/${roomId}/messages/${messageId}`, {
    method: "DELETE",
  });
}

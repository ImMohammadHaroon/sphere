import { apiClient, ApiError, getAccessToken } from "@/lib/apiClient";
import { resolveApiBaseUrl } from "@/lib/backendUrl";

const API_URL = resolveApiBaseUrl();

const blobCache = new Map();
const inflightDownloads = new Map();

function cacheKey(roomId, messageId, attachmentId) {
  return `${roomId}:${messageId}:${attachmentId}`;
}

export async function uploadChatMessageAttachment(roomId, messageId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const headers = {};
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const deviceId = localStorage.getItem("ps_device_id");
  if (deviceId) {
    headers["X-Device-Id"] = deviceId;
  }

  let response;
  try {
    response = await fetch(
      `${API_URL}/chat/rooms/${roomId}/messages/${messageId}/attachments`,
      {
        method: "POST",
        headers,
        body: formData,
        credentials: "include",
      }
    );
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && /failed to fetch|network/i.test(err.message));

    throw new ApiError(
      isNetworkError
        ? "Could not reach the server while uploading. Try again in a moment."
        : err instanceof Error
          ? err.message
          : "Upload failed",
      0
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "Upload failed";
    throw new ApiError(message, response.status);
  }

  return data;
}

export async function downloadChatMessageAttachment(
  roomId,
  messageId,
  attachmentId
) {
  const key = cacheKey(roomId, messageId, attachmentId);

  if (blobCache.has(key)) {
    return blobCache.get(key);
  }

  if (inflightDownloads.has(key)) {
    return inflightDownloads.get(key);
  }

  const downloadPromise = (async () => {
    const headers = {};
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const deviceId = localStorage.getItem("ps_device_id");
    if (deviceId) {
      headers["X-Device-Id"] = deviceId;
    }

    const response = await fetch(
      `${API_URL}/chat/rooms/${roomId}/messages/${messageId}/attachments/${attachmentId}/download`,
      {
        method: "GET",
        headers,
        credentials: "include",
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const message =
        typeof data.message === "string" ? data.message : "Download failed";
      throw new ApiError(message, response.status);
    }

    const blob = await response.blob();
    blobCache.set(key, blob);
    return blob;
  })();

  inflightDownloads.set(key, downloadPromise);

  try {
    return await downloadPromise;
  } finally {
    inflightDownloads.delete(key);
  }
}

export function primeChatAttachmentBlob(
  roomId,
  messageId,
  attachmentId,
  blob
) {
  blobCache.set(cacheKey(roomId, messageId, attachmentId), blob);
}

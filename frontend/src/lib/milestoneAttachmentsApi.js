import { apiClient, ApiError, getAccessToken } from "@/lib/apiClient";
import { resolveApiBaseUrl } from "@/lib/backendUrl";

const API_URL = resolveApiBaseUrl();

export function getMilestoneAttachments(milestoneId) {
  return apiClient(`/milestones/${milestoneId}/attachments`);
}

export async function uploadMilestoneAttachment(milestoneId, file) {
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

  const response = await fetch(
    `${API_URL}/milestones/${milestoneId}/attachments`,
    {
      method: "POST",
      headers,
      body: formData,
      credentials: "include",
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string" ? data.message : "Upload failed";
    throw new ApiError(message, response.status);
  }

  return data;
}

export function deleteMilestoneAttachment(milestoneId, attachmentId) {
  return apiClient(
    `/milestones/${milestoneId}/attachments/${attachmentId}`,
    {
      method: "DELETE",
    }
  );
}

export function getMilestoneDownloadUrl(milestoneId, attachmentId) {
  return `${API_URL}/milestones/${milestoneId}/attachments/${attachmentId}/download`;
}

export async function downloadMilestoneAttachment(milestoneId, attachmentId) {
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
    getMilestoneDownloadUrl(milestoneId, attachmentId),
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

  return response.blob();
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export async function apiClient(path, options = {}) {
  const { skipAuth, headers, body, method = "GET" } = options;

  const requestHeaders = {
    "Content-Type": "application/json",
    ...(headers || {}),
  };

  if (!skipAuth && accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  const deviceId = localStorage.getItem("ps_device_id");
  if (deviceId) {
    requestHeaders["X-Device-Id"] = deviceId;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new Error(message);
  }

  return data;
}

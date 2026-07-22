import { resolveApiBaseUrl } from "@/lib/backendUrl";

const API_URL = resolveApiBaseUrl();

let accessToken = null;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

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

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError ||
      (err instanceof Error && /failed to fetch|network/i.test(err.message));

    throw new ApiError(
      isNetworkError
        ? "Could not reach the server. Check that the API is running and try again."
        : err instanceof Error
          ? err.message
          : "Request failed",
      0
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "Request failed";
    throw new ApiError(message, response.status);
  }

  return data;
}

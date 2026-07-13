const API_VERSION_PREFIX = "/api/v1";

function stripApiVersionSuffix(url) {
  if (url.endsWith(API_VERSION_PREFIX)) {
    return url.slice(0, -API_VERSION_PREFIX.length);
  }
  return url;
}

export function resolveBackendBaseUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const fallback = import.meta.env.PROD
    ? "https://ml-sphere.onrender.com"
    : "http://localhost:5000";

  return stripApiVersionSuffix((configured || fallback).replace(/\/+$/, ""));
}

export function resolveApiBaseUrl() {
  return `${resolveBackendBaseUrl()}${API_VERSION_PREFIX}`;
}

export function resolveSocketUrl() {
  const socketConfigured = import.meta.env.VITE_SOCKET_URL?.trim();
  if (socketConfigured) {
    return stripApiVersionSuffix(socketConfigured.replace(/\/+$/, ""));
  }

  return resolveBackendBaseUrl();
}

function parseBooleanEnv(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/** Socket.io needs a persistent Node server — not available on Vercel serverless. */
export function areSocketsEnabled() {
  const override = parseBooleanEnv(import.meta.env.VITE_ENABLE_SOCKETS?.trim());
  if (override !== null) {
    return override;
  }

  return !resolveSocketUrl().includes("vercel.app");
}

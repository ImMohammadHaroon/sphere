import { io } from "socket.io-client";

function resolveSocketUrl() {
  const configured = import.meta.env.VITE_API_URL?.trim();
  const fallback = import.meta.env.PROD
    ? "https://ml-sphere.onrender.com"
    : "http://localhost:5000";

  let base = (configured || fallback).replace(/\/+$/, "");

  if (base.endsWith("/api/v1")) {
    base = base.slice(0, -"/api/v1".length);
  }

  return base;
}

export function createSocket(accessToken) {
  return io(resolveSocketUrl(), {
    autoConnect: false,
    auth: { token: accessToken },
  });
}

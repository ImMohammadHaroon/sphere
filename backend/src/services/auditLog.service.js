import { AuditLog } from "../models/AuditLog.js";

export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

export async function logAction({
  organizationId = null,
  actorId = null,
  action,
  targetType = null,
  targetId = null,
  metadata = {},
  ip = null,
}) {
  try {
    await AuditLog.create({
      organizationId,
      actorId,
      action,
      targetType,
      targetId,
      metadata,
      ip,
    });
  } catch (err) {
    console.error("[auditLog] Failed to write audit log:", err.message);
  }
}

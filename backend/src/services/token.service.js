import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";

const REFRESH_COOKIE = "ps_refresh_token";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateDeviceId() {
  return crypto.randomUUID();
}

export function generateOpaqueToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function getRefreshCookieOptions() {
  const maxAge = parseRefreshMaxAge(env.JWT_REFRESH_EXPIRES_IN);
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge,
    path: "/api/v1/auth",
  };
}

function parseRefreshMaxAge(duration) {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return value * multipliers[unit];
}

export function getRefreshExpiresAt() {
  return new Date(Date.now() + parseRefreshMaxAge(env.JWT_REFRESH_EXPIRES_IN));
}

export async function storeRefreshToken({ userId, rawToken, deviceId }) {
  return RefreshToken.create({
    userId,
    tokenHash: hashToken(rawToken),
    deviceId,
    expiresAt: getRefreshExpiresAt(),
  });
}

export async function rotateRefreshToken({ oldRawToken, userId, deviceId }) {
  const oldHash = hashToken(oldRawToken);
  const existing = await RefreshToken.findOne({ tokenHash: oldHash });

  if (!existing || existing.revoked || existing.expiresAt < new Date()) {
    if (existing?.revoked) {
      await RefreshToken.updateMany(
        { userId, revoked: false },
        { revoked: true, revokedAt: new Date() }
      );
    }
    return null;
  }

  existing.revoked = true;
  existing.revokedAt = new Date();
  await existing.save();

  const newRaw = generateOpaqueToken();
  await storeRefreshToken({ userId, rawToken: newRaw, deviceId });
  return newRaw;
}

export async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne(
    { tokenHash },
    { revoked: true, revokedAt: new Date() }
  );
}

export async function revokeAllRefreshTokens(userId) {
  await RefreshToken.updateMany(
    { userId, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
}

export function setRefreshCookie(res, rawToken) {
  res.cookie(REFRESH_COOKIE, rawToken, getRefreshCookieOptions());
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    path: "/api/v1/auth",
  });
}

export function getRefreshTokenFromRequest(req) {
  return req.cookies?.[REFRESH_COOKIE] || null;
}

export { REFRESH_COOKIE };

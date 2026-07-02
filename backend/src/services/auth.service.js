import crypto from "crypto";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { InviteToken } from "../models/InviteToken.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { hashPassword, verifyPassword } from "./password.service.js";
import {
  signAccessToken,
  generateOpaqueToken,
  generateDeviceId,
  storeRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  revokeRefreshToken,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  getRefreshTokenFromRequest,
  hashToken,
} from "./token.service.js";
import { uniqueOrgSlug } from "../utils/slug.js";

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId?.toString() ?? null,
    isActive: user.isActive,
  };
}

function buildAccessPayload(user) {
  return {
    userId: user._id.toString(),
    organizationId: user.organizationId?.toString() ?? null,
    role: user.role,
    email: user.email,
  };
}

async function issueSession(res, user, deviceId) {
  const accessToken = signAccessToken(buildAccessPayload(user));
  const refreshToken = generateOpaqueToken();
  await storeRefreshToken({
    userId: user._id,
    rawToken: refreshToken,
    deviceId,
  });
  setRefreshCookie(res, refreshToken);
  return { accessToken, user: sanitizeUser(user) };
}

export async function registerOrganization({
  res,
  orgName,
  name,
  email,
  password,
  deviceId,
}) {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const slug = await uniqueOrgSlug(Organization, orgName);
  const organization = await Organization.create({ name: orgName, slug });
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    organizationId: organization._id,
    name,
    email,
    passwordHash,
    role: "org_admin",
  });

  return issueSession(res, user, deviceId || generateDeviceId());
}

export async function login({ res, email, password, deviceId }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !user.isActive) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (user.organizationId) {
    const org = await Organization.findById(user.organizationId);
    if (!org?.isActive) {
      const err = new Error("Organization is suspended");
      err.status = 403;
      throw err;
    }
  }

  return issueSession(res, user, deviceId || generateDeviceId());
}

export async function refreshSession(req, res) {
  const rawToken = getRefreshTokenFromRequest(req);
  if (!rawToken) {
    const err = new Error("Refresh token missing");
    err.status = 401;
    throw err;
  }

  const deviceId = req.headers["x-device-id"] || generateDeviceId();
  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    const err = new Error("Invalid refresh token");
    err.status = 401;
    throw err;
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) {
    const err = new Error("User inactive");
    err.status = 401;
    throw err;
  }

  const newRaw = await rotateRefreshToken({
    oldRawToken: rawToken,
    userId: user._id,
    deviceId,
  });

  if (!newRaw) {
    const err = new Error("Refresh token reuse detected");
    err.status = 401;
    throw err;
  }

  setRefreshCookie(res, newRaw);
  const accessToken = signAccessToken(buildAccessPayload(user));
  return { accessToken, user: sanitizeUser(user) };
}

export async function logout(req, res) {
  const rawToken = getRefreshTokenFromRequest(req);
  if (rawToken) {
    await revokeRefreshToken(rawToken);
  }
  clearRefreshCookie(res);
}

export async function logoutAll(userId, res) {
  await revokeAllRefreshTokens(userId);
  clearRefreshCookie(res);
}

export async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return sanitizeUser(user);
}

export async function createInvite({
  organizationId,
  email,
  role,
  invitedBy,
}) {
  const existing = await User.findOne({ email, organizationId });
  if (existing) {
    const err = new Error("User already in organization");
    err.status = 409;
    throw err;
  }

  const rawToken = generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await InviteToken.create({
    organizationId,
    email,
    role,
    tokenHash: InviteToken.hashToken(rawToken),
    invitedBy,
    expiresAt,
  });

  return { token: rawToken, expiresAt };
}

export async function acceptInvite({
  res,
  token,
  name,
  password,
  deviceId,
}) {
  const tokenHash = InviteToken.hashToken(token);
  const invite = await InviteToken.findOne({ tokenHash });

  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    const err = new Error("Invalid or expired invite");
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ email: invite.email });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    organizationId: invite.organizationId,
    name,
    email: invite.email,
    passwordHash,
    role: invite.role,
  });

  invite.acceptedAt = new Date();
  await invite.save();

  return issueSession(res, user, deviceId || generateDeviceId());
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    return { message: "If that email exists, a reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return {
    message: "If that email exists, a reset link has been sent.",
    resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined,
  };
}

export async function resetPassword({ token, password }) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    const err = new Error("Invalid or expired reset token");
    err.status = 400;
    throw err;
  }

  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await revokeAllRefreshTokens(user._id);

  return { message: "Password updated successfully" };
}

import crypto from "crypto";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { InviteToken } from "../models/InviteToken.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { OrgRegistrationPending } from "../models/OrgRegistrationPending.js";
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
import { env } from "../config/env.js";
import { sendMail } from "./email/transporter.js";
import { buildPasswordResetEmail } from "./email/passwordResetEmail.js";
import { buildOrgVerificationEmail } from "./email/orgVerificationEmail.js";

const ORG_VERIFICATION_TTL_MS = 15 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateVerificationCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

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

export async function requestOrganizationRegistration({
  orgName,
  name,
  email,
  password,
}) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const verificationCode = generateVerificationCode();
  const passwordHash = await hashPassword(password);

  await OrgRegistrationPending.findOneAndUpdate(
    { email: normalizedEmail },
    {
      orgName: orgName.trim(),
      name: name.trim(),
      passwordHash,
      verificationCodeHash: hashToken(verificationCode),
      verificationExpires: new Date(Date.now() + ORG_VERIFICATION_TTL_MS),
      verificationAttempts: 0,
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const { subject, html, text } = buildOrgVerificationEmail({
    name: name.trim(),
    orgName: orgName.trim(),
    code: verificationCode,
  });

  await sendMail({
    to: normalizedEmail,
    subject,
    html,
    text,
  });

  return {
    message: "Verification code sent to your email.",
    email: normalizedEmail,
    expiresInMinutes: ORG_VERIFICATION_TTL_MS / 60_000,
  };
}

export async function verifyOrganizationRegistration({
  res,
  email,
  code,
  deviceId,
}) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  const pending = await OrgRegistrationPending.findOne({
    email: normalizedEmail,
  }).select("+passwordHash +verificationCodeHash");

  if (!pending) {
    const err = new Error("No pending registration found for this email");
    err.status = 404;
    throw err;
  }

  if (pending.verificationExpires < new Date()) {
    await OrgRegistrationPending.deleteOne({ _id: pending._id });
    const err = new Error("Verification code has expired. Please register again.");
    err.status = 400;
    throw err;
  }

  if (pending.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
    await OrgRegistrationPending.deleteOne({ _id: pending._id });
    const err = new Error(
      "Too many failed attempts. Please register again."
    );
    err.status = 400;
    throw err;
  }

  if (hashToken(normalizedCode) !== pending.verificationCodeHash) {
    pending.verificationAttempts += 1;
    await pending.save();
    const err = new Error("Invalid verification code");
    err.status = 400;
    throw err;
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    await OrgRegistrationPending.deleteOne({ _id: pending._id });
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const slug = await uniqueOrgSlug(Organization, pending.orgName);
  const organization = await Organization.create({
    name: pending.orgName,
    slug,
  });

  const user = await User.create({
    organizationId: organization._id,
    name: pending.name,
    email: normalizedEmail,
    passwordHash: pending.passwordHash,
    role: "org_admin",
  });

  await OrgRegistrationPending.deleteOne({ _id: pending._id });

  return issueSession(res, user, deviceId || generateDeviceId());
}

export async function resendOrganizationVerification(email) {
  const normalizedEmail = email.trim().toLowerCase();

  const pending = await OrgRegistrationPending.findOne({
    email: normalizedEmail,
  });

  if (!pending) {
    const err = new Error("No pending registration found for this email");
    err.status = 404;
    throw err;
  }

  const verificationCode = generateVerificationCode();
  pending.verificationCodeHash = hashToken(verificationCode);
  pending.verificationExpires = new Date(Date.now() + ORG_VERIFICATION_TTL_MS);
  pending.verificationAttempts = 0;
  await pending.save();

  const { subject, html, text } = buildOrgVerificationEmail({
    name: pending.name,
    orgName: pending.orgName,
    code: verificationCode,
  });

  await sendMail({
    to: normalizedEmail,
    subject,
    html,
    text,
  });

  return {
    message: "Verification code resent.",
    email: normalizedEmail,
    expiresInMinutes: ORG_VERIFICATION_TTL_MS / 60_000,
  };
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
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return { message: "If that email exists, a reset link has been sent." };
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password/${resetToken}`;
  const { subject, html, text } = buildPasswordResetEmail({
    name: user.name,
    resetUrl,
  });

  await sendMail({
    to: normalizedEmail,
    subject,
    html,
    text,
  });

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

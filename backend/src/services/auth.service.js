import crypto from "crypto";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { OrgRegistrationPending } from "../models/OrgRegistrationPending.js";
import { PlatformSettings } from "../models/PlatformSettings.js";
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
import { sendMail, sendMailInBackground } from "./email/transporter.js";
import { buildPasswordResetEmail } from "./email/passwordResetEmail.js";
import { buildOrgVerificationEmail } from "./email/orgVerificationEmail.js";
import { buildOrgRegistrationAdminEmail } from "./email/orgRegistrationAdminEmail.js";
import { createNotification } from "./notification.service.js";
import { formatPublicUser } from "../utils/formatUser.js";
import { startTrialSubscription } from "./billing.service.js";
import { getBillingSummaryForUser } from "./billing.service.js";
import {
  normalizeBillingInterval,
  normalizePlanId,
} from "../config/plans.js";

const ORG_VERIFICATION_TTL_MS = 15 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;

function generateVerificationCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function sanitizeUser(user) {
  return {
    ...formatPublicUser(user),
    organizationId: user.organizationId?.toString() ?? null,
  };
}

function effectiveVerificationStatus(org) {
  return org?.verificationStatus ?? "approved";
}

async function enrichUserWithOrgContext(user) {
  const base = sanitizeUser(user);

  if (!user.organizationId) {
    return {
      ...base,
      organizationVerificationStatus: null,
      organizationVerificationRejectionReason: null,
    };
  }

  const org = await Organization.findById(user.organizationId)
    .select("verificationStatus verificationRejectionReason billing")
    .lean();

  const status = effectiveVerificationStatus(org);

  const billingSummary =
    user.role === "org_admin" ? await getBillingSummaryForUser(org) : null;

  return {
    ...base,
    organizationVerificationStatus: status,
    organizationVerificationRejectionReason:
      status === "rejected" ? org?.verificationRejectionReason ?? null : null,
    billing: billingSummary,
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
  const enrichedUser = await enrichUserWithOrgContext(user);
  return { accessToken, user: enrichedUser };
}

export async function requestOrganizationRegistration({
  orgName,
  name,
  email,
  password,
  plan,
  interval,
}) {
  const platformSettings = await PlatformSettings.getOrCreate();
  if (!platformSettings.registration?.allowSelfServeSignup) {
    const err = new Error("Self-serve registration is currently disabled");
    err.status = 403;
    throw err;
  }

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
      selectedPlan: normalizePlanId(plan),
      billingInterval: normalizeBillingInterval(interval),
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
    verificationStatus: "pending",
  });

  await startTrialSubscription({
    organization,
    adminEmail: normalizedEmail,
    adminName: pending.name,
    planId: pending.selectedPlan,
    interval: pending.billingInterval,
  });

  const user = await User.create({
    organizationId: organization._id,
    name: pending.name,
    email: normalizedEmail,
    passwordHash: pending.passwordHash,
    role: "org_admin",
  });

  await OrgRegistrationPending.deleteOne({ _id: pending._id });

  try {
    const superAdmins = await User.find({ role: "super_admin" }).select("_id");
    await Promise.all(
      superAdmins.map((admin) =>
        createNotification({
          organizationId: null,
          userId: admin._id,
          type: "org_registered",
          payload: {
            organizationName: organization.name,
            organizationId: organization._id.toString(),
          },
        })
      )
    );
  } catch (notifyErr) {
    console.error("Failed to create org_registered notifications:", notifyErr);
  }

  const reviewUrl = `${env.CLIENT_URL}/super-admin/organizations/${organization._id}`;
  const { subject, html, text } = buildOrgRegistrationAdminEmail({
    orgName: organization.name,
    adminName: user.name,
    adminEmail: user.email,
    reviewUrl,
  });
  sendMailInBackground({
    to: env.PLATFORM_ADMIN_EMAIL,
    subject,
    html,
    text,
  });

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

  const platformSettings = await PlatformSettings.getOrCreate();
  if (platformSettings.maintenance?.enabled && user.role !== "super_admin") {
    const message = platformSettings.maintenance?.message?.trim();
    const err = new Error(
      message || "The platform is currently under maintenance. Please try again later."
    );
    err.status = 503;
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
  const enrichedUser = await enrichUserWithOrgContext(user);
  return { accessToken, user: enrichedUser };
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
  return enrichUserWithOrgContext(user);
}

export async function updateProfile(userId, { name }) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  user.name = name.trim();
  await user.save();

  return enrichUserWithOrgContext(user);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !user.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    const err = new Error("Current password is incorrect");
    err.status = 400;
    throw err;
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return { message: "Password updated successfully" };
}

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function uploadAvatar(userId, file) {
  if (!file) {
    const err = new Error("No image uploaded");
    err.status = 400;
    throw err;
  }

  if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    const err = new Error("Only JPEG, PNG, WebP, and GIF images are allowed");
    err.status = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  user.avatar = {
    mimeType: file.mimetype,
    size: file.size,
    data: file.buffer,
    updatedAt: new Date(),
  };
  await user.save();

  return enrichUserWithOrgContext(user);
}

export async function getAvatar(userId) {
  return getAvatarForViewer({
    viewer: { userId, role: "super_admin" },
    targetUserId: userId,
    skipAccessCheck: true,
  });
}

async function assertCanViewUserAvatar(viewer, targetUserId) {
  if (viewer.userId === targetUserId) {
    return;
  }

  if (viewer.role === "super_admin") {
    return;
  }

  const target = await User.findById(targetUserId)
    .select("organizationId isActive")
    .lean();

  if (!target || !target.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (
    !viewer.organizationId ||
    !target.organizationId ||
    viewer.organizationId !== target.organizationId.toString()
  ) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
}

export async function getAvatarForViewer({
  viewer,
  targetUserId,
  skipAccessCheck = false,
}) {
  if (!skipAccessCheck) {
    await assertCanViewUserAvatar(viewer, targetUserId);
  }

  const user = await User.findById(targetUserId).select("+avatar.data");
  if (!user || !user.isActive || !user.avatar?.data) {
    return null;
  }

  return {
    mimeType: user.avatar.mimeType,
    data: user.avatar.data,
    updatedAt: user.avatar.updatedAt,
  };
}

export async function deleteAvatar(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  user.avatar = undefined;
  await user.save();

  return enrichUserWithOrgContext(user);
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

import crypto from "crypto";
import { Invite } from "../models/Invite.js";
import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { hashPassword } from "./password.service.js";
import {
  signAccessToken,
  generateDeviceId,
  generateOpaqueToken,
  storeRefreshToken,
  setRefreshCookie,
} from "./token.service.js";
import { sendMailInBackground } from "./email/transporter.js";
import { buildInviteEmail } from "./email/inviteEmail.js";
import { env } from "../config/env.js";
import { logAction } from "./auditLog.service.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
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

function formatInvite(invite) {
  return {
    id: invite._id.toString(),
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    invitedBy: invite.invitedBy?.toString?.() ?? invite.invitedBy,
  };
}

function requireOrganizationId(organizationId) {
  if (!organizationId) {
    throw httpError("Organization membership required", 403);
  }
}

async function markExpiredIfNeeded(invite) {
  if (invite.status === "pending" && invite.expiresAt < new Date()) {
    invite.status = "expired";
    await invite.save();
  }
  return invite;
}

export async function createInvite({
  organizationId,
  email,
  role,
  invitedBy,
}) {
  requireOrganizationId(organizationId);

  const normalizedEmail = email.toLowerCase().trim();

  const existingInOrg = await User.findOne({
    email: normalizedEmail,
    organizationId,
  });
  if (existingInOrg) {
    throw httpError("This email already belongs to a user in your organization", 409);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw httpError("This email is already registered on ProjectSphere", 409);
  }

  const pendingInvite = await Invite.findOne({
    organizationId,
    email: normalizedEmail,
    status: "pending",
    expiresAt: { $gt: new Date() },
  });
  if (pendingInvite) {
    throw httpError("A pending invite already exists for this email", 409);
  }

  const [organization, inviter] = await Promise.all([
    Organization.findById(organizationId),
    User.findById(invitedBy),
  ]);

  if (!organization) {
    throw httpError("Organization not found", 404);
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await Invite.create({
    organizationId,
    email: normalizedEmail,
    role,
    token,
    invitedBy,
    expiresAt,
  });

  const acceptUrl = `${env.CLIENT_URL}/invite/${token}`;
  const { subject, html, text } = buildInviteEmail({
    orgName: organization.name,
    inviterName: inviter?.name || "A team member",
    role,
    acceptUrl,
  });

  sendMailInBackground({
    to: normalizedEmail,
    subject,
    html,
    text,
  });

  return {
    invite: formatInvite(invite),
    token,
  };
}

export async function getInviteByToken(token) {
  const invite = await Invite.findOne({ token }).populate(
    "organizationId",
    "name"
  );

  if (!invite) {
    throw httpError("Invalid invite link", 404);
  }

  await markExpiredIfNeeded(invite);

  if (invite.status === "accepted") {
    throw httpError("This invite has already been used", 400);
  }

  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    throw httpError("This invite has expired", 400);
  }

  return {
    email: invite.email,
    role: invite.role,
    organizationName: invite.organizationId?.name ?? "your organization",
  };
}

export async function acceptInvite({ res, token, name, password, deviceId, ip }) {
  const invite = await Invite.findOne({ token });

  if (!invite) {
    throw httpError("Invalid invite link", 404);
  }

  await markExpiredIfNeeded(invite);

  if (invite.status === "accepted") {
    throw httpError("This invite has already been used", 400);
  }

  if (invite.status === "expired" || invite.expiresAt < new Date()) {
    throw httpError("This invite has expired", 400);
  }

  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) {
    throw httpError("This email is already registered", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    organizationId: invite.organizationId,
    name,
    email: invite.email,
    passwordHash,
    role: invite.role,
  });

  invite.status = "accepted";
  await invite.save();

  await logAction({
    organizationId: invite.organizationId,
    actorId: user._id,
    action: "invite.accepted",
    targetType: "Invite",
    targetId: invite._id,
    metadata: { email: invite.email, role: invite.role },
    ip: ip ?? null,
  });

  return issueSession(res, user, deviceId || generateDeviceId());
}

export async function listInvites(organizationId) {
  requireOrganizationId(organizationId);

  const invites = await Invite.find({
    organizationId,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .select("-token")
    .populate("invitedBy", "name email")
    .sort({ createdAt: -1 });

  return invites.map((invite) => ({
    ...formatInvite(invite),
    invitedBy: invite.invitedBy
      ? {
          id: invite.invitedBy._id.toString(),
          name: invite.invitedBy.name,
          email: invite.invitedBy.email,
        }
      : null,
  }));
}

export async function revokeInvite({ organizationId, inviteId }) {
  requireOrganizationId(organizationId);

  const invite = await Invite.findOne({
    _id: inviteId,
    organizationId,
    status: "pending",
  });

  if (!invite) {
    throw httpError("Pending invite not found", 404);
  }

  const email = invite.email;
  await invite.deleteOne();

  return { message: "Invite revoked", email };
}

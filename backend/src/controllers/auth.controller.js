import * as authService from "../services/auth.service.js";
import { User } from "../models/User.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";

export async function registerOrg(req, res, next) {
  try {
    const result = await authService.registerOrganization({
      res,
      ...req.body,
    });

    await logAction({
      organizationId: result.user.organizationId,
      actorId: result.user.id,
      action: "org.created",
      targetType: "Organization",
      targetId: result.user.organizationId,
      metadata: { email: result.user.email },
      ip: getClientIp(req),
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login({ res, ...req.body });

    await logAction({
      organizationId: result.user.organizationId,
      actorId: result.user.id,
      action: "auth.login",
      targetType: "User",
      targetId: result.user.id,
      metadata: {},
      ip: getClientIp(req),
    });

    res.json(result);
  } catch (err) {
    if (err.status === 401) {
      const email = req.body.email?.toLowerCase()?.trim();
      const existingUser = email ? await User.findOne({ email }) : null;

      await logAction({
        organizationId: existingUser?.organizationId ?? null,
        actorId: existingUser?._id ?? null,
        action: "auth.login_failed",
        targetType: existingUser ? "User" : null,
        targetId: existingUser?._id ?? null,
        metadata: { email: email ?? req.body.email },
        ip: getClientIp(req),
      });
    }

    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const result = await authService.refreshSession(req, res);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req, res);
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req, res, next) {
  try {
    await authService.logoutAll(req.user.userId, res);
    res.json({ message: "Logged out of all devices" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getCurrentUser(req.user.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function invite(req, res, next) {
  try {
    const result = await authService.createInvite({
      organizationId: req.user.organizationId,
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.user.userId,
    });
    res.status(201).json({
      message: "Invite created",
      inviteToken: process.env.NODE_ENV === "development" ? result.token : undefined,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function acceptInvite(req, res, next) {
  try {
    const result = await authService.acceptInvite({ res, ...req.body });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

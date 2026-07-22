import * as authService from "../services/auth.service.js";

export async function registerOrg(req, res, next) {
  try {
    const result = await authService.requestOrganizationRegistration(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function verifyOrgRegistration(req, res, next) {
  try {
    const result = await authService.verifyOrganizationRegistration({
      res,
      ...req.body,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function resendOrgVerification(req, res, next) {
  try {
    const result = await authService.resendOrganizationVerification(
      req.body.email
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login({ res, ...req.body });

    res.json(result);
  } catch (err) {
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

export async function updateProfile(req, res, next) {
  try {
    const user = await authService.updateProfile(req.user.userId, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req, res, next) {
  try {
    const user = await authService.uploadAvatar(req.user.userId, req.file);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function getAvatar(req, res, next) {
  try {
    const avatar = await authService.getAvatar(req.user.userId);
    if (!avatar) {
      return res.status(404).json({ message: "Avatar not found" });
    }

    res.set("Content-Type", avatar.mimeType);
    res.set("Cache-Control", "private, max-age=3600");
    res.send(avatar.data);
  } catch (err) {
    next(err);
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    const user = await authService.deleteAvatar(req.user.userId);
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

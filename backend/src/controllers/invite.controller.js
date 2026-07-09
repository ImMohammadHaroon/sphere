import * as inviteService from "../services/invite.service.js";
import { Invite } from "../models/Invite.js";
import { logAction, getClientIp } from "../services/auditLog.service.js";
import { createNotification } from "../services/notification.service.js";

export async function createInvite(req, res, next) {
  try {
    const result = await inviteService.createInvite({
      organizationId: req.user.organizationId,
      email: req.body.email,
      role: req.body.role,
      invitedBy: req.user.userId,
    });

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "user.invited",
      targetType: "Invite",
      targetId: result.invite.id,
      metadata: { email: req.body.email, role: req.body.role },
      ip: getClientIp(req),
    });

    res.status(201).json({
      message: "Invite sent",
      invite: result.invite,
      token: result.token,
    });
  } catch (err) {
    next(err);
  }
}

export async function getInviteByToken(req, res, next) {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    res.json(invite);
  } catch (err) {
    next(err);
  }
}

export async function acceptInvite(req, res, next) {
  try {
    const result = await inviteService.acceptInvite({
      res,
      token: req.params.token,
      name: req.body.name,
      password: req.body.password,
      deviceId: req.body.deviceId,
      ip: getClientIp(req),
    });

    try {
      const invite = await Invite.findOne({ token: req.params.token });
      if (invite?.invitedBy) {
        await createNotification({
          organizationId: invite.organizationId,
          userId: invite.invitedBy,
          type: "invite_accepted",
          payload: {
            invitedUserName: result.user.name,
            invitedUserEmail: result.user.email,
          },
        });
      }
    } catch (notifyErr) {
      console.error("Failed to create invite_accepted notification:", notifyErr);
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listInvites(req, res, next) {
  try {
    const invites = await inviteService.listInvites(req.user.organizationId);
    res.json({ invites });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvite(req, res, next) {
  try {
    const result = await inviteService.revokeInvite({
      organizationId: req.user.organizationId,
      inviteId: req.params.id,
    });

    await logAction({
      organizationId: req.user.organizationId,
      actorId: req.user.userId,
      action: "invite.revoked",
      targetType: "Invite",
      targetId: req.params.id,
      metadata: { email: result.email },
      ip: getClientIp(req),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

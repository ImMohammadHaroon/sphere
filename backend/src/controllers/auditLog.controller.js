import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog.js";

function formatAuditLog(log) {
  const actor = log.actorId;
  return {
    id: log._id.toString(),
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId?.toString() ?? null,
    metadata: log.metadata ?? {},
    ip: log.ip,
    createdAt: log.createdAt,
    actor: actor
      ? {
          name: actor.name,
          email: actor.email,
        }
      : null,
  };
}

export async function listOrgAuditLogs(req, res, next) {
  try {
    const query = req.validatedQuery ?? req.query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter = {
      organizationId: new mongoose.Types.ObjectId(req.user.organizationId),
    };

    if (query.action) {
      filter.action = query.action;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = query.startDate;
      }
      if (query.endDate) {
        filter.createdAt.$lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("actorId", "name email")
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs: logs.map(formatAuditLog),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
}

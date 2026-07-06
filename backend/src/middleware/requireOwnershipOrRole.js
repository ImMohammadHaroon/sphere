import { logAction, getClientIp } from "../services/auditLog.service.js";

export function requireOwnershipOrRole(resourceLoader, allowedRoles, ownerField) {
  return async (req, res, next) => {
    try {
      const resource = await resourceLoader(req);

      if (!resource) {
        return res.status(404).json({ message: "Not found" });
      }

      req.resource = resource;

      const roleAllowed = allowedRoles.includes(req.user.role);
      const ownerId = resource[ownerField]?.toString?.() ?? null;
      const isOwner = ownerId !== null && ownerId === req.user.id;

      if (roleAllowed || isOwner) {
        return next();
      }

      logAction({
        organizationId: req.user.organizationId,
        actorId: req.user.userId,
        action: "rbac.access_denied",
        metadata: {
          attemptedAction: `${req.method} ${req.originalUrl}`,
          reason: "insufficient permissions",
        },
        ip: getClientIp(req),
      });

      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    } catch (err) {
      next(err);
    }
  };
}

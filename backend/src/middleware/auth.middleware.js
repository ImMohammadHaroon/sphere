import { verifyAccessToken } from "../services/token.service.js";
import { User } from "../models/User.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      organizationId: user.organizationId?.toString() ?? null,
      role: user.role,
      email: user.email,
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
}

import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import {
  registerOrgSchema,
  loginSchema,
  inviteSchema,
  acceptInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

/**
 * @openapi
 * /auth/register-org:
 *   post:
 *     summary: Register organization and org admin
 *     tags: [Auth]
 */
router.post(
  "/register-org",
  authRateLimiter,
  validate(registerOrgSchema),
  authController.registerOrg
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 */
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

router.post("/refresh", authRateLimiter, authController.refresh);

router.post("/logout", authenticate, authController.logout);
router.post("/logout-all", authenticate, authController.logoutAll);
router.get("/me", authenticate, authController.me);

router.post(
  "/invite",
  authenticate,
  requireRole(["org_admin", "project_manager"]),
  validate(inviteSchema),
  authController.invite
);

router.post(
  "/accept-invite",
  authRateLimiter,
  validate(acceptInviteSchema),
  authController.acceptInvite
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;

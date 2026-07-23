import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { avatarUpload } from "../config/upload.js";
import {
  registerOrgSchema,
  verifyOrgRegistrationSchema,
  resendOrgVerificationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

/**
 * @openapi
 * /auth/register-org:
 *   post:
 *     summary: Register organization and org admin
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orgName, name, email, password]
 *             properties:
 *               orgName: { type: string, minLength: 2, maxLength: 100 }
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *               deviceId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Organization and admin account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       409:
 *         description: Email already registered
 */
router.post(
  "/register-org",
  authRateLimiter,
  validate(registerOrgSchema),
  authController.registerOrg
);

router.post(
  "/verify-org-registration",
  authRateLimiter,
  validate(verifyOrgRegistrationSchema),
  authController.verifyOrgRegistration
);

router.post(
  "/resend-org-verification",
  authRateLimiter,
  validate(resendOrgVerificationSchema),
  authController.resendOrgVerification
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               deviceId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Login successful; refresh token set via httpOnly cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token and issue new access token
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: New access token issued; refresh cookie rotated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       401:
 *         description: Missing or invalid refresh token
 */
router.post("/refresh", authRateLimiter, authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Revoke current refresh token
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Logged out }
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     summary: Revoke all refresh tokens for the current user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out of all devices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Logged out of all devices }
 */
router.post("/logout-all", authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       401:
 *         description: Authentication required
 */
router.get("/me", authenticate, authController.me);

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 100 }
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     organizationId: { type: string }
 *       401:
 *         description: Authentication required
 */
router.patch(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  authController.updateProfile
);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password for the current user
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Password updated successfully }
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Authentication required
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

/**
 * @openapi
 * /auth/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *       400:
 *         description: Invalid file type or file too large (max 2MB)
 *   get:
 *     summary: Get current user avatar image
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Avatar image bytes
 *       404:
 *         description: Avatar not found
 *   delete:
 *     summary: Remove profile avatar
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Avatar removed
 */
router.post(
  "/avatar",
  authenticate,
  avatarUpload.single("avatar"),
  authController.uploadAvatar
);
router.get("/avatar", authenticate, authController.getAvatar);
router.delete("/avatar", authenticate, authController.deleteAvatar);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset email sent if account exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password via token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Password updated successfully }
 *       400:
 *         description: Invalid or expired reset token
 */
router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;

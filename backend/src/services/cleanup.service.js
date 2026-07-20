import { RefreshToken } from "../models/RefreshToken.js";
import { logger } from "../utils/logger.js";

const REVOKED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Deletes refresh tokens that are expired, or revoked more than 30 days ago.
 * @returns {Promise<number>} Number of documents deleted
 */
export async function cleanupExpiredRefreshTokens() {
  const now = new Date();
  const revokedCutoff = new Date(now.getTime() - REVOKED_RETENTION_MS);

  const result = await RefreshToken.deleteMany({
    $or: [
      { expiresAt: { $lt: now } },
      { revoked: true, revokedAt: { $lt: revokedCutoff } },
    ],
  });

  const deletedCount = result.deletedCount ?? 0;
  logger.info(
    `[cleanup] Removed ${deletedCount} expired/revoked refresh token(s)`
  );
  return deletedCount;
}

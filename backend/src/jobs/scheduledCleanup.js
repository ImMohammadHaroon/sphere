import cron from "node-cron";
import { env } from "../config/env.js";
import { cleanupExpiredRefreshTokens } from "../services/cleanup.service.js";
import { logger } from "../utils/logger.js";

/**
 * Starts scheduled maintenance jobs when ENABLE_SCHEDULED_CLEANUP is true.
 */
export function startScheduledJobs() {
  if (!env.ENABLE_SCHEDULED_CLEANUP) {
    logger.info("[cleanup] Scheduled cleanup disabled (ENABLE_SCHEDULED_CLEANUP=false)");
    return null;
  }

  const task = cron.schedule("0 3 * * *", async () => {
    try {
      await cleanupExpiredRefreshTokens();
    } catch (err) {
      logger.error("[cleanup] Scheduled refresh-token cleanup failed", err);
    }
  });

  logger.info("[cleanup] Scheduled refresh-token cleanup daily at 03:00");
  return task;
}

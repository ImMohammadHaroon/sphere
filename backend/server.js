import http from "http";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { startScheduledJobs } from "./src/jobs/scheduledCleanup.js";
import { initSockets } from "./src/sockets/index.js";
import { logger } from "./src/utils/logger.js";

async function start() {
  await connectDB();

  const server = http.createServer(app);
  initSockets(server);
  startScheduledJobs();

  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`ProjectSphere API listening on port ${env.PORT}`);
    logger.info(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});

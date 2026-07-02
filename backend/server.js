import http from "http";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import { env } from "./src/config/env.js";
import { logger } from "./src/utils/logger.js";

async function start() {
  await connectDB();

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`ProjectSphere API listening on port ${env.PORT}`);
    logger.info(`Swagger UI: http://localhost:${env.PORT}/api-docs`);
  });
}

start().catch((err) => {
  logger.error("Failed to start server", err);
  process.exit(1);
});

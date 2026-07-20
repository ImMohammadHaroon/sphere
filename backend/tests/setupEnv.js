/**
 * Ensure required env vars exist before any module that imports config/env.js.
 * Import this file first in any test that pulls in sockets / token / app code.
 * Does not open a database connection.
 */
import crypto from "node:crypto";

process.env.MONGO_URI ??= "mongodb://127.0.0.1:27017/projectsphere-test-unused";
process.env.JWT_SECRET ??= "test-jwt-secret";
process.env.JWT_REFRESH_SECRET ??= "test-jwt-refresh-secret";
process.env.ENCRYPTION_KEY ??= "0123456789abcdef0123456789abcdef";
process.env.FILE_ENCRYPTION_KEY ??= crypto.randomBytes(32).toString("base64");
process.env.NODE_ENV ??= "test";

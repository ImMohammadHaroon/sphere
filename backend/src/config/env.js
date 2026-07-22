import dotenv from "dotenv";

dotenv.config();

function required(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function parseClientUrls() {
  const raw = process.env.CLIENT_URL || "http://localhost:5173";
  return raw.split(",").map((url) => url.trim()).filter(Boolean);
}

const isProduction = process.env.NODE_ENV === "production";

function resolveCookieSecure() {
  if ("COOKIE_SECURE" in process.env) {
    return process.env.COOKIE_SECURE === "true";
  }
  return isProduction;
}

function resolveCookieSameSite() {
  if ("COOKIE_SAME_SITE" in process.env) {
    return process.env.COOKIE_SAME_SITE;
  }
  return isProduction ? "none" : "strict";
}

const cookieSecure = resolveCookieSecure();
const cookieSameSite = resolveCookieSameSite();

if (isProduction && cookieSameSite !== "none") {
  console.warn(
    'COOKIE_SAME_SITE is not "none"; cross-origin cookies will likely fail between Vercel frontend and Render backend.'
  );
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_URLS: parseClientUrls(),
  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  ENCRYPTION_KEY: required("ENCRYPTION_KEY"),
  // AES-256-GCM master key for attachment bytes at rest (base64-encoded 32 bytes)
  FILE_ENCRYPTION_KEY: required("FILE_ENCRYPTION_KEY"),
  COOKIE_SECURE: cookieSecure,
  COOKIE_SAME_SITE: cookieSameSite,
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "",
  PLATFORM_ADMIN_EMAIL:
    process.env.PLATFORM_ADMIN_EMAIL || "sphereadmin1@gmail.com",
  ENABLE_SCHEDULED_CLEANUP: process.env.ENABLE_SCHEDULED_CLEANUP !== "false",
  isProduction,
};

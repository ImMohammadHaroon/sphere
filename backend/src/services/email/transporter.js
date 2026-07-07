import nodemailer from "nodemailer";
import { env } from "../../config/env.js";

let transporter;

export function getTransporter() {
  if (!transporter) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      const err = new Error(
        "Email is not configured. Set SMTP_USER and SMTP_PASS in your environment."
      );
      err.status = 503;
      throw err;
    }

    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }

  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const transport = getTransporter();
  return transport.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}

/** Fire-and-forget email; logs failures without blocking the HTTP response. */
export function sendMailInBackground({ to, subject, html, text }) {
  sendMail({ to, subject, html, text }).catch((err) => {
    console.error(`[email] Failed to send to ${to}:`, err.message);
  });
}

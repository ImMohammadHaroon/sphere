export function buildPasswordResetEmail({ name, resetUrl }) {
  const subject = "Reset your ProjectSphere password";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.04em;">ProjectSphere</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Reset your password</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                Hi ${escapeHtml(name)}, we received a request to reset your password.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">
                Click the button below to choose a new password. This link expires in 1 hour.
              </p>
              <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">
                Reset password
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
                If you did not request this, you can safely ignore this email. If the button does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#6366f1;">
                ${resetUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Hi ${name},`,
    "",
    "We received a request to reset your ProjectSphere password.",
    "",
    "Reset your password using this link (expires in 1 hour):",
    resetUrl,
    "",
    "If you did not request this, you can safely ignore this email.",
  ].join("\n");

  return { subject, html, text };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

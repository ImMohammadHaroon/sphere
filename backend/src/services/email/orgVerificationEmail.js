export function buildOrgVerificationEmail({ name, orgName, code }) {
  const subject = "Verify your email to create your organization";

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
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Verify your email</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                Hi ${escapeHtml(name)}, use the code below to finish creating
                <strong>${escapeHtml(orgName)}</strong> on ProjectSphere.
              </p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#52525b;">
                Your verification code:
              </p>
              <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:0.3em;color:#18181b;">
                ${code}
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                This code expires in 15 minutes. If you did not request this, you can safely ignore this email.
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
    `Use this code to finish creating ${orgName} on ProjectSphere:`,
    "",
    code,
    "",
    "This code expires in 15 minutes.",
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

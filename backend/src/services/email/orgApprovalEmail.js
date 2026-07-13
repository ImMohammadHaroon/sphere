export function buildOrgApprovalEmail({ name, orgName }) {
  const subject = "Your organization has been approved";

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
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">You're approved</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                Hi ${escapeHtml(name)}, great news  <strong>${escapeHtml(orgName)}</strong> has been approved on ProjectSphere.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3f3f46;">
                You can now log in and access your full organization dashboard.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                If you have any questions, reply to this email or contact support.
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
    `Great news  ${orgName} has been approved on ProjectSphere.`,
    "",
    "You can now log in and access your full organization dashboard.",
    "",
    "If you have any questions, contact support.",
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

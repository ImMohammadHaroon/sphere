export function buildOrgRejectionEmail({ name, orgName, reason }) {
  const subject = "Your organization registration was not approved";

  const reasonBlock = reason
    ? `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                <strong>Reason:</strong> ${escapeHtml(reason)}
              </p>`
    : "";

  const reasonText = reason ? `\nReason: ${reason}\n` : "";

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
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">Registration not approved</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                Hi ${escapeHtml(name)}, we're sorry — the registration for
                <strong>${escapeHtml(orgName)}</strong> on ProjectSphere was not approved.
              </p>
              ${reasonBlock}
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                If you believe this was a mistake, please contact support.
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
    `We're sorry — the registration for ${orgName} on ProjectSphere was not approved.`,
    reasonText,
    "If you believe this was a mistake, please contact support.",
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

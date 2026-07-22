export function buildOrgRegistrationAdminEmail({
  orgName,
  adminName,
  adminEmail,
  reviewUrl,
}) {
  const subject = `New organization registration: ${orgName}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:12px;padding:32px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6366f1;text-transform:uppercase;letter-spacing:0.04em;">ProjectSphere</p>
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">New organization awaiting approval</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                <strong>${escapeHtml(orgName)}</strong> has registered and is waiting for your review.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background:#fafafa;border-radius:8px;padding:16px;">
                <tr>
                  <td style="font-size:14px;line-height:1.6;color:#52525b;">
                    <p style="margin:0 0 8px;"><strong>Organization:</strong> ${escapeHtml(orgName)}</p>
                    <p style="margin:0 0 8px;"><strong>Admin:</strong> ${escapeHtml(adminName)}</p>
                    <p style="margin:0;"><strong>Email:</strong> ${escapeHtml(adminEmail)}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;">
                <a href="${escapeHtml(reviewUrl)}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 20px;border-radius:8px;">
                  Review registration
                </a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
                You can approve or reject this organization from the Super Admin dashboard.
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
    "New organization awaiting approval",
    "",
    `Organization: ${orgName}`,
    `Admin: ${adminName}`,
    `Email: ${adminEmail}`,
    "",
    `Review: ${reviewUrl}`,
    "",
    "You can approve or reject this organization from the Super Admin dashboard.",
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

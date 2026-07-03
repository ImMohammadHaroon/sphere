const ROLE_LABELS = {
  org_admin: "Organization Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
  client: "Client",
};

export function buildInviteEmail({ orgName, inviterName, role, acceptUrl }) {
  const roleLabel = ROLE_LABELS[role] || role;
  const subject = `You're invited to join ${orgName} on ProjectSphere`;

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
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;">You're invited</h1>
              <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#3f3f46;">
                <strong>${escapeHtml(inviterName)}</strong> invited you to join
                <strong>${escapeHtml(orgName)}</strong> as
                <strong>${escapeHtml(roleLabel)}</strong>.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#52525b;">
                Click the button below to set your password and access your workspace.
              </p>
              <a href="${acceptUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px;">
                Accept invitation
              </a>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#71717a;">
                This link expires in 7 days. If the button does not work, copy and paste this URL into your browser:
              </p>
              <p style="margin:8px 0 0;font-size:13px;line-height:1.6;word-break:break-all;color:#6366f1;">
                ${acceptUrl}
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
    `${inviterName} invited you to join ${orgName} on ProjectSphere as ${roleLabel}.`,
    "",
    "Accept your invitation and set your password:",
    acceptUrl,
    "",
    "This link expires in 7 days.",
  ].join("\n");

  // One-time use: acceptance is enforced server-side via invite status checks.
  return { subject, html, text };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

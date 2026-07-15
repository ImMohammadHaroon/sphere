import { Card } from "@/components/ui/Card";

const ROLE_LABELS = {
  super_admin: "Super admin",
  org_admin: "Org admin",
  project_manager: "Project manager",
  team_member: "Team member",
  client: "Client",
};

const ROLE_ORDER = [
  "super_admin",
  "org_admin",
  "project_manager",
  "team_member",
  "client",
];

export function UsersByRoleBreakdown({
  usersByRole = {},
  title = "Users by role",
  description = "Platform users broken down by account role.",
}) {
  const rows = ROLE_ORDER.map((role) => ({
    role,
    label: ROLE_LABELS[role] ?? role,
    count: usersByRole[role] ?? 0,
  }));

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <Card className="h-full p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>

      {total === 0 ? (
        <div className="mt-6 flex h-64 items-center justify-center">
          <p className="text-sm text-text-secondary">Not enough data yet</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li key={row.role}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text-primary">{row.label}</span>
                <span className="text-text-secondary">
                  {row.count.toLocaleString()}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(row.count / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

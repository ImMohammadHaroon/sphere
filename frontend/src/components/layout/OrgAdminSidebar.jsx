import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const orgAdminNav = [
  {
    label: "Org overview",
    to: "/admin",
    match: (p) => p === "/admin",
  },
  {
    label: "Team members",
    to: "/admin/users",
    match: (p) =>
      p === "/admin/users" ||
      (/^\/admin\/users\/[^/]+$/.test(p) && p !== "/admin/users/invite"),
  },
  {
    label: "Invite user",
    to: "/admin/users/invite",
    match: (p) => p === "/admin/users/invite",
  },
  {
    label: "All projects",
    to: "/admin/projects",
    match: (p) => p === "/admin/projects",
  },
  {
    label: "Reports",
    to: "/admin/reports",
    match: (p) => p === "/admin/reports",
  },
  {
    label: "Audit logs",
    to: "/admin/audit-logs",
    match: (p) => p === "/admin/audit-logs",
  },
  {
    label: "Settings",
    to: "/admin/settings",
    match: (p) => p === "/admin/settings",
  },
];

export function OrgAdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-surface-raised p-5 lg:p-8">
      <div className="pb-6">
        <Link
          to="/admin"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Org Admin</p>
      </div>

      <nav>
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          Organization
        </p>
        <ul className="space-y-2">
          {orgAdminNav.map((item) => {
            const isActive = item.match
              ? item.match(pathname)
              : pathname === item.to;

            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

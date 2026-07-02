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
    match: (p) => p === "/admin/users",
  },
  {
    label: "Invite user",
    to: "/admin/users/invite",
    match: (p) => p === "/admin/users/invite",
  },
  {
    label: "User detail",
    to: "/admin/users",
    match: (p) => /^\/admin\/users\/[^/]+$/.test(p) && p !== "/admin/users/invite",
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
    <aside className="w-full shrink-0 border-b border-border bg-surface-raised lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link
          to="/admin"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Org Admin</p>
      </div>

      <nav className="px-4 pb-6 lg:px-6">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
          Organization
        </p>
        <ul className="space-y-1">
          {orgAdminNav.map((item) => {
            const isActive = item.match
              ? item.match(pathname)
              : pathname === item.to;

            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const superAdminNav = [
  {
    label: "Platform overview",
    to: "/super-admin",
    match: (p) => p === "/super-admin",
  },
  {
    label: "Organizations",
    to: "/super-admin/organizations",
    match: (p) => p === "/super-admin/organizations",
  },
  {
    label: "Organization detail",
    to: "/super-admin/organizations",
    match: (p) =>
      /^\/super-admin\/organizations\/[^/]+$/.test(p),
  },
  {
    label: "Users",
    to: "/super-admin/users",
    match: (p) => p === "/super-admin/users",
  },
  {
    label: "Audit logs",
    to: "/super-admin/audit-logs",
    match: (p) => p === "/super-admin/audit-logs",
  },
  {
    label: "Settings",
    to: "/super-admin/settings",
    match: (p) => p === "/super-admin/settings",
  },
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-full shrink-0 border-b border-border bg-surface-raised lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link
          to="/super-admin"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Super Admin</p>
      </div>

      <nav className="px-4 pb-6 lg:px-6">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
          Platform
        </p>
        <ul className="space-y-1">
          {superAdminNav.map((item) => {
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

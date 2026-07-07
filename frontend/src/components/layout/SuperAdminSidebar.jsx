import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePendingOrganizations } from "@/features/platform/hooks/usePendingOrganizations";

const superAdminNav = [
  {
    label: "Platform overview",
    to: "/super-admin",
    match: (p) => p === "/super-admin",
  },
  {
    label: "Organizations",
    to: "/super-admin/organizations",
    match: (p) =>
      p === "/super-admin/organizations" ||
      /^\/super-admin\/organizations\/[^/]+$/.test(p),
    showPendingBadge: true,
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
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const { data: pendingData } = usePendingOrganizations({ page: 1, limit: 1 });
  const pendingCount = pendingData?.total ?? 0;

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/super-admin"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
      </div>

      <nav>
        <ul className="space-y-2">
          {superAdminNav.map((item) => {
            const isActive = item.match
              ? item.match(pathname)
              : pathname === item.to;
            const badge =
              item.showPendingBadge && pendingCount > 0 ? pendingCount : null;

            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <span>{item.label}</span>
                  {badge ? (
                    <span
                      className={cn(
                        "ml-2 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold",
                        isActive
                          ? "bg-primary text-white"
                          : "bg-surface text-text-secondary"
                      )}
                    >
                      {badge > 99 ? "99+" : badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

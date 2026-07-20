import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { usePendingOrganizations } from "@/features/platform/hooks/usePendingOrganizations";

const superAdminNav = [
  {
    label: "Platform overview",
    to: "/super-admin",
    match: (p) => p === "/super-admin",
    icon: "lucide:layout-dashboard",
  },
  {
    label: "Organizations",
    to: "/super-admin/organizations",
    match: (p) =>
      p === "/super-admin/organizations" ||
      /^\/super-admin\/organizations\/[^/]+$/.test(p),
    showPendingBadge: true,
    icon: "lucide:building",
  },
  {
    label: "Users",
    to: "/super-admin/users",
    match: (p) => p === "/super-admin/users",
    icon: "lucide:users",
  },
  {
    label: "Reports",
    to: "/super-admin/reports",
    match: (p) => p === "/super-admin/reports",
    icon: "lucide:bar-chart-3",
  },
  {
    label: "Notifications",
    to: "/super-admin/notifications",
    match: (p) => p === "/super-admin/notifications",
    icon: "lucide:bell",
  },
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const { data: pendingData } = usePendingOrganizations({ page: 1, limit: 1 });
  const pendingCount = pendingData?.total ?? 0;

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-3 lg:p-8">
      <Link
        to="/super-admin"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-text-primary hover:text-primary lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-primary lg:hidden">PS</span>
      </Link>

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
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:justify-between lg:px-4",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <span className="flex items-center justify-center gap-3 lg:justify-start">
                    <span className="relative shrink-0">
                      <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
                      {badge ? (
                        <span
                          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary lg:hidden"
                          aria-hidden
                        />
                      ) : null}
                    </span>
                    <span className="hidden lg:inline">{item.label}</span>
                  </span>
                  {badge ? (
                    <span
                      className={cn(
                        "hidden min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-semibold lg:inline-flex",
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

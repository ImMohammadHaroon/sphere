import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { usePendingOrganizations } from "@/features/platform/hooks/usePendingOrganizations";
import { SidebarNavItem } from "./SidebarNavItem";

const superAdminNav = [
  {
    label: "Platform overview",
    to: "/super-admin",
    match: (p) => p === "/super-admin",
    icon: LayoutDashboard,
  },
  {
    label: "Organizations",
    to: "/super-admin/organizations",
    match: (p) =>
      p === "/super-admin/organizations" ||
      /^\/super-admin\/organizations\/[^/]+$/.test(p),
    showPendingBadge: true,
    icon: Building,
  },
  {
    label: "Users",
    to: "/super-admin/users",
    match: (p) => p === "/super-admin/users",
    icon: Users,
  },
  {
    label: "Reports",
    to: "/super-admin/reports",
    match: (p) => p === "/super-admin/reports",
    icon: BarChart3,
  },
];

export function SuperAdminSidebar() {
  const { pathname } = useLocation();
  const { data: pendingData } = usePendingOrganizations({ page: 1, limit: 1 });
  const pendingCount = pendingData?.total ?? 0;

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-3 lg:p-8">
      <Link
        to="/super-admin"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-sidebar-text hover:opacity-90 lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-sidebar-text lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {superAdminNav.map((item) => {
            const badge =
              item.showPendingBadge && pendingCount > 0 ? pendingCount : null;

            return (
              <SidebarNavItem
                key={item.label}
                to={item.to}
                label={item.label}
                icon={item.icon}
                badge={badge}
                isActive={
                  item.match ? item.match(pathname) : pathname === item.to
                }
              />
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

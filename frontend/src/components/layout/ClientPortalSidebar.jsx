import { Link, useLocation } from "react-router-dom";
import { BarChart3, Flag, FolderKanban } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

const clientPortalNav = [
  {
    label: "My projects",
    to: "/portal",
    match: (p) => p === "/portal",
    icon: FolderKanban,
  },
  {
    label: "Milestones",
    to: "/portal/milestones",
    match: (p) => p === "/portal/milestones",
    icon: Flag,
  },
  {
    label: "Reports",
    to: "/portal/reports",
    match: (p) => p === "/portal/reports",
    icon: BarChart3,
  },
];

export function ClientPortalSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-3 lg:p-8">
      <Link
        to="/portal"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-sidebar-text hover:opacity-90 lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-sidebar-text lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {clientPortalNav.map((item) => (
            <SidebarNavItem
              key={item.label}
              to={item.to}
              label={item.label}
              icon={item.icon}
              isActive={
                item.match ? item.match(pathname) : pathname === item.to
              }
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

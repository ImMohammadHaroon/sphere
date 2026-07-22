import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Building2,
  FolderKanban,
  Users,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

const orgAdminNav = [
  {
    label: "Org overview",
    to: "/admin",
    match: (p) => p === "/admin",
    icon: Building2,
  },
  {
    label: "Team members",
    to: "/admin/users",
    match: (p) =>
      p === "/admin/users" || /^\/admin\/users\/[^/]+$/.test(p),
    icon: Users,
  },
  {
    label: "All projects",
    to: "/admin/projects",
    match: (p) => p === "/admin/projects" || /^\/admin\/projects\/[^/]+$/.test(p),
    icon: FolderKanban,
  },
  {
    label: "Reports",
    to: "/admin/reports",
    match: (p) => p === "/admin/reports",
    icon: BarChart3,
  },
];

export function OrgAdminSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-3 lg:p-8">
      <Link
        to="/admin"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-sidebar-text hover:opacity-90 lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-sidebar-text lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {orgAdminNav.map((item) => (
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

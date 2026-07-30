import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Flag,
  FolderKanban,
  MessageSquare,
} from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

const projectManagerNav = [
  {
    label: "My projects",
    to: "/dashboard",
    match: (p) => p === "/dashboard",
    roles: ["project_manager"],
    icon: FolderKanban,
  },
  {
    label: "Calendar view",
    to: "/dashboard/calendar",
    match: (p) =>
      p === "/dashboard/calendar" || p.endsWith("/calendar"),
    roles: ["project_manager"],
    icon: Calendar,
  },
  {
    label: "Reports",
    to: "/dashboard/reports",
    match: (p) =>
      p === "/dashboard/reports" || p.includes("/reports"),
    roles: ["project_manager"],
    icon: BarChart3,
  },
  {
    label: "Milestones",
    to: "/dashboard/milestones",
    match: (p) =>
      p === "/dashboard/milestones" || p.includes("/milestones"),
    roles: ["project_manager"],
    icon: Flag,
  },
  {
    label: "Chat",
    to: "/chat",
    match: (p) => p === "/chat" || p.startsWith("/chat/"),
    roles: ["project_manager"],
    icon: MessageSquare,
  },
];

export function getProjectManagerNavForRole(role) {
  if (!role) return [];
  return projectManagerNav.filter((item) => item.roles.includes(role));
}

export function ProjectManagerSidebar({ userRole }) {
  const { pathname } = useLocation();
  const navItems = getProjectManagerNavForRole(userRole);

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-3 lg:p-8">
      <Link
        to="/dashboard"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-sidebar-text hover:opacity-90 lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-sidebar-text lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => (
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

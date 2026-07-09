import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const projectManagerNav = [
  {
    label: "My projects",
    to: "/dashboard",
    match: (p) => p === "/dashboard",
    roles: ["project_manager"],
    icon: "lucide:folder-kanban",
  },
  {
    label: "Calendar view",
    to: "/dashboard/calendar",
    match: (p) => p === "/dashboard/calendar",
    roles: ["project_manager"],
    icon: "lucide:calendar",
  },
  {
    label: "Reports",
    to: "/dashboard/reports",
    match: (p) => p === "/dashboard/reports",
    roles: ["project_manager"],
    icon: "lucide:bar-chart-3",
  },
  {
    label: "Milestones",
    to: "/dashboard/milestones",
    match: (p) => p === "/dashboard/milestones",
    roles: ["project_manager"],
    icon: "lucide:flag",
  },
  {
    label: "Notifications",
    to: "/dashboard/notifications",
    match: (p) => p === "/dashboard/notifications",
    roles: ["project_manager"],
    icon: "lucide:bell",
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
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-3 lg:p-8">
      <Link
        to="/dashboard"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-text-primary hover:text-primary lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-primary lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname === item.to;

            return (
              <li key={item.label}>
                <Link
                  to={item.to}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:justify-start lg:px-4",
                    isActive
                      ? "bg-primary-subtle text-primary"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  )}
                >
                  <Icon icon={item.icon} className="h-5 w-5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const projectManagerNav = [
  {
    label: "My projects overview",
    to: "/dashboard",
    match: (p) => p === "/dashboard",
    roles: ["project_manager"],
  },
  {
    label: "Kanban board",
    to: "/dashboard/kanban",
    match: (p) => p === "/dashboard/kanban",
    roles: ["project_manager"],
  },
  {
    label: "Task detail",
    to: "/dashboard/tasks/overview",
    match: (p) => p.startsWith("/dashboard/tasks/"),
    roles: ["project_manager"],
  },
  {
    label: "Calendar view",
    to: "/dashboard/calendar",
    match: (p) => p === "/dashboard/calendar",
    roles: ["project_manager"],
  },
  {
    label: "Reports",
    to: "/dashboard/reports",
    match: (p) => p === "/dashboard/reports",
    roles: ["project_manager"],
  },
  {
    label: "Milestones",
    to: "/dashboard/milestones",
    match: (p) => p === "/dashboard/milestones",
    roles: ["project_manager"],
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
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/dashboard"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
      </div>

      <nav>
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname === item.to;

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

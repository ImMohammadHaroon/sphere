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
    label: "Create project",
    to: "/dashboard/projects/new",
    match: (p) => p === "/dashboard/projects/new",
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
    label: "Project team",
    to: "/dashboard/team",
    match: (p) => p === "/dashboard/team",
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
    <aside className="w-full shrink-0 border-b border-border bg-surface-raised lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link
          to="/dashboard"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Project manager</p>
      </div>

      <nav className="px-4 pb-6 lg:px-6">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
          Workspace
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.match ? item.match(pathname) : pathname === item.to;

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

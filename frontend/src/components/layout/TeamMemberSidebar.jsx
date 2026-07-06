import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const teamMemberNav = [
  {
    label: "My tasks (dashboard)",
    to: "/member",
    match: (p) => p === "/member",
  },
  {
    label: "Kanban board",
    to: "/member/kanban",
    match: (p) => p === "/member/kanban",
  },
  {
    label: "Task detail",
    to: "/member/tasks/overview",
    match: (p) => p.startsWith("/member/tasks/"),
  },
  {
    label: "Notifications",
    to: "/member/notifications",
    match: (p) => p === "/member/notifications",
  },
];

export function TeamMemberSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/member"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Team Member dashboard</p>
      </div>

      <nav>
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          Workspace
        </p>
        <ul className="space-y-2">
          {teamMemberNav.map((item) => {
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

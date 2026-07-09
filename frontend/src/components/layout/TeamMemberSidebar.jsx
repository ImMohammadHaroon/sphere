import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const teamMemberNav = [
  {
    label: "Dashboard",
    to: "/member",
    match: (p) => p === "/member",
    icon: "lucide:layout-dashboard",
  },
  {
    label: "My tasks",
    to: "/member/tasks",
    match: (p) => p === "/member/tasks",
    icon: "lucide:check-square",
  },
  {
    label: "Notifications",
    to: "/member/notifications",
    match: (p) => p === "/member/notifications",
    icon: "lucide:bell",
  },
];

export function TeamMemberSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-3 lg:p-8">
      <Link
        to="/member"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-text-primary hover:text-primary lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-primary lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {teamMemberNav.map((item) => {
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

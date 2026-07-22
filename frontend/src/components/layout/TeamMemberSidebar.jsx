import { Link, useLocation } from "react-router-dom";
import { CheckSquare, LayoutDashboard } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";

const teamMemberNav = [
  {
    label: "Dashboard",
    to: "/member",
    match: (p) => p === "/member",
    icon: LayoutDashboard,
  },
  {
    label: "My tasks",
    to: "/member/tasks",
    match: (p) => p === "/member/tasks",
    icon: CheckSquare,
  },
];

export function TeamMemberSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-3 lg:p-8">
      <Link
        to="/member"
        className="mb-6 flex items-center justify-center lg:justify-start"
      >
        <span className="hidden font-display text-lg font-semibold text-sidebar-text hover:opacity-90 lg:inline">
          ProjectSphere
        </span>
        <span className="text-lg font-bold text-sidebar-text lg:hidden">PS</span>
      </Link>

      <nav>
        <ul className="space-y-2">
          {teamMemberNav.map((item) => (
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

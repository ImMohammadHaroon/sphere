import { Link, useLocation } from "react-router-dom";
import { FolderKanban, MessageSquare, ClipboardCheck } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { useClientPendingReviews } from "@/features/client-portal/hooks/useClientPendingReviews";

const clientPortalNav = [
  {
    label: "Your projects",
    to: "/portal",
    match: (p) => p === "/portal",
    icon: FolderKanban,
  },
  {
    label: "Reviews",
    to: "/portal/milestones",
    match: (p) => p === "/portal/milestones",
    icon: ClipboardCheck,
    showPendingBadge: true,
  },
  {
    label: "Messages",
    to: "/chat",
    match: (p) => p === "/chat" || p.startsWith("/chat/"),
    icon: MessageSquare,
  },
];

export function ClientPortalSidebar() {
  const { pathname } = useLocation();
  const { pendingCount } = useClientPendingReviews();

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
              badge={
                item.showPendingBadge && pendingCount > 0
                  ? pendingCount
                  : undefined
              }
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

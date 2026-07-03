import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const clientPortalNav = [
  {
    label: "My projects",
    to: "/portal",
    match: (p) => p === "/portal",
  },
  {
    label: "Project progress",
    to: "/portal/progress",
    match: (p) => p === "/portal/progress",
  },
  {
    label: "Milestones",
    to: "/portal/milestones",
    match: (p) => p === "/portal/milestones",
  },
  {
    label: "Reports",
    to: "/portal/reports",
    match: (p) => p === "/portal/reports",
  },
];

export function ClientPortalSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-full shrink-0 border-b border-border bg-surface-raised lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link
          to="/portal"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Client portal</p>
      </div>

      <nav className="px-4 pb-6 lg:px-6">
        <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
          Workspace
        </p>
        <ul className="space-y-1">
          {clientPortalNav.map((item) => {
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

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
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/portal"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Client Portal</p>
      </div>

      <nav>
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
          Workspace
        </p>
        <ul className="space-y-2">
          {clientPortalNav.map((item) => {
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

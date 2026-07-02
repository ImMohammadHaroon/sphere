import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getDashboardPath } from "@/lib/authHelpers";

const dashboardNav = [
  { label: "Org Admin", to: "/admin", roles: ["org_admin"] },
  {
    label: "Project Manager",
    to: "/dashboard",
    roles: ["project_manager"],
  },
  { label: "Team Member", to: "/dashboard", roles: ["team_member"] },
  { label: "Client Portal", to: "/portal", roles: ["client"] },
];

export function getNavForRole(role) {
  if (!role) return [];
  return dashboardNav.filter((item) => item.roles?.includes(role));
}

export function DashboardSidebar({ userRole }) {
  const location = useLocation();
  const homePath = userRole ? getDashboardPath(userRole) : "/dashboard";
  const roleNav = getNavForRole(userRole);

  const mainLinks = [
    { label: "Overview", to: homePath },
    { label: "Profile", to: "/profile" },
  ];

  return (
    <aside className="w-full shrink-0 border-b border-border bg-surface-raised lg:w-64 lg:border-b-0 lg:border-r">
      <div className="p-4 lg:p-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Role-based workspace</p>
      </div>

      <nav className="space-y-6 px-4 pb-6 lg:px-6">
        <div>
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Workspace
          </p>
          <ul className="space-y-1">
            {mainLinks.map((item) => (
              <li key={item.to}>
                <SidebarLink
                  to={item.to}
                  label={item.label}
                  active={location.pathname === item.to}
                />
              </li>
            ))}
          </ul>
        </div>

        {roleNav.length > 0 ? (
          <div>
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
              Your dashboard
            </p>
            <ul className="space-y-1">
              {roleNav.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <SidebarLink
                    to={item.to}
                    label={item.label}
                    active={location.pathname === item.to}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Account
          </p>
          <ul className="space-y-1">
            <SidebarLink to="/login" label="Sign in" active={false} />
            <SidebarLink to="/register" label="Register org" active={false} />
          </ul>
        </div>
      </nav>
    </aside>
  );
}

function SidebarLink({ to, label, active }) {
  return (
    <Link
      to={to}
      className={cn(
        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-subtle text-primary"
          : "text-text-secondary hover:bg-surface hover:text-text-primary"
      )}
    >
      {label}
    </Link>
  );
}

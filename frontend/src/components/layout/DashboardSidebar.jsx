import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getDashboardPath } from "@/lib/authHelpers";

const dashboardNav = [
  { label: "Org Admin", to: "/admin", roles: ["org_admin"] },
  {
    label: "Project Manager dashboard",
    to: "/dashboard",
    roles: ["project_manager"],
  },
  { label: "Team Member dashboard", to: "/member", roles: ["team_member"] },
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
    <aside className="flex h-full w-full flex-col border-r border-border bg-surface-raised p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
        <p className="mt-1 text-xs text-text-muted">Role-based workspace</p>
      </div>

      <nav className="space-y-8">
        <div>
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Workspace
          </p>
          <ul className="space-y-2">
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
            <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
              Your dashboard
            </p>
            <ul className="space-y-2">
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
          <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wide text-text-muted">
            Account
          </p>
          <ul className="space-y-2">
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
        "block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary-subtle text-primary"
          : "text-text-secondary hover:bg-surface hover:text-text-primary"
      )}
    >
      {label}
    </Link>
  );
}

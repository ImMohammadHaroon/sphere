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

  const allLinks = [
    ...mainLinks,
    ...roleNav,
    { label: "Sign in", to: "/login" },
    { label: "Register org", to: "/register" },
  ];

  return (
    <aside className="flex h-full w-full flex-col border-r border-sidebar-border bg-sidebar p-5 lg:h-screen lg:p-8">
      <div className="pb-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-sidebar-text hover:opacity-90"
        >
          ProjectSphere
        </Link>
      </div>

      <nav>
        <ul className="space-y-2">
          {allLinks.map((item) => (
            <li key={`${item.to}-${item.label}`}>
              <SidebarLink
                to={item.to}
                label={item.label}
                active={location.pathname === item.to}
              />
            </li>
          ))}
        </ul>
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
          ? "border-l-[3px] border-l-primary bg-sidebar-active-bg pl-[calc(1rem-3px)] text-sidebar-active-text"
          : "border-l-[3px] border-l-transparent text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-hover"
      )}
    >
      {label}
    </Link>
  );
}

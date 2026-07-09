import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ProfileMenu } from "@/components/layout/ProfileMenu";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import {
  getNotificationsPath,
  getTaskDetailPath,
} from "@/features/notifications/notificationPaths";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";

const DASHBOARD_NAMES = {
  super_admin: "Super Admin",
  org_admin: "Org Admin",
  project_manager: "Project Manager",
  team_member: "Team Member",
  client: "Client Portal",
};

export function DashboardShell({
  sidebar,
  title,
  description,
  children,
  showPageHeader = true,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const DASHBOARD_ROOT_PATHS = [
    "/dashboard",
    "/member",
    "/admin",
    "/super-admin",
    "/portal",
  ];
  const isRootPage = DASHBOARD_ROOT_PATHS.includes(location.pathname);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      syncLogout();
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="flex">
        <div className="sticky top-0 z-30 h-screen w-16 shrink-0 lg:w-64">
          {sidebar}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {DASHBOARD_NAMES[user?.role] ?? "Dashboard"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <NotificationBell
                  viewAllPath={getNotificationsPath(user?.role)}
                  buildTaskPath={(payload) => getTaskDetailPath(user?.role, payload)}
                />
                <ProfileMenu
                  user={user}
                  onLogout={handleLogout}
                  roleLabel={DASHBOARD_NAMES[user?.role] ?? "Dashboard"}
                />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {showPageHeader && title ? (
              <>
                {!isRootPage && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                  >
                    <Icon icon="lucide:arrow-left" className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                )}
                <div className="mb-6 sm:mb-8">
                  <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
                  {description ? (
                    <p className="mt-2 text-sm text-text-secondary sm:text-base">
                      {description}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

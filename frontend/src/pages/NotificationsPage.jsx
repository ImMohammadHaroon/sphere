import { DashboardShell } from "@/components/layout/DashboardShell";
import { getRoleSidebar } from "@/components/layout/roleSidebars";
import { NotificationsPageContent } from "@/features/notifications/NotificationsPageContent";
import { getNotificationPath } from "@/features/notifications/notificationPaths";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPage() {
  const { user } = useAuth();

  return (
    <DashboardShell
      sidebar={getRoleSidebar(user?.role)}
      dashboardRole={user?.role}
      title="Notifications"
      description="Updates on assignments, invites, and activity."
    >
      <NotificationsPageContent
        buildNotificationPath={(notification) =>
          getNotificationPath(user?.role, notification)
        }
      />
    </DashboardShell>
  );
}

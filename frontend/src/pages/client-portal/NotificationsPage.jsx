import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { NotificationsPageContent } from "@/features/notifications/NotificationsPageContent";
import { getTaskDetailPath } from "@/features/notifications/notificationPaths";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPage() {
  const { user } = useAuth();

  return (
    <ClientPortalLayout
      title="Notifications"
      description="Updates on your projects and activity."
    >
      <NotificationsPageContent
        buildTaskPath={(payload) => getTaskDetailPath(user?.role, payload)}
      />
    </ClientPortalLayout>
  );
}

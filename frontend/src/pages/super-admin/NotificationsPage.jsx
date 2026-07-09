import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { NotificationsPageContent } from "@/features/notifications/NotificationsPageContent";
import { getTaskDetailPath } from "@/features/notifications/notificationPaths";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPage() {
  const { user } = useAuth();

  return (
    <SuperAdminLayout
      title="Notifications"
      description="Platform updates and organization activity."
    >
      <NotificationsPageContent
        buildTaskPath={(payload) => getTaskDetailPath(user?.role, payload)}
      />
    </SuperAdminLayout>
  );
}

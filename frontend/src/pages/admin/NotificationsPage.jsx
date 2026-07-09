import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { NotificationsPageContent } from "@/features/notifications/NotificationsPageContent";
import { getTaskDetailPath } from "@/features/notifications/notificationPaths";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPage() {
  const { user } = useAuth();

  return (
    <OrgAdminLayout
      title="Notifications"
      description="Updates on assignments, invites, and activity."
    >
      <NotificationsPageContent
        buildTaskPath={(payload) => getTaskDetailPath(user?.role, payload)}
      />
    </OrgAdminLayout>
  );
}

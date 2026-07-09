import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { NotificationsPageContent } from "@/features/notifications/NotificationsPageContent";
import { getTaskDetailPath } from "@/features/notifications/notificationPaths";
import { useAuth } from "@/hooks/useAuth";

export function NotificationsPage() {
  const { user } = useAuth();

  return (
    <ProjectManagerLayout
      title="Notifications"
      description="Updates on assignments, invites, and activity."
    >
      <NotificationsPageContent
        buildTaskPath={(payload) => getTaskDetailPath(user?.role, payload)}
      />
    </ProjectManagerLayout>
  );
}

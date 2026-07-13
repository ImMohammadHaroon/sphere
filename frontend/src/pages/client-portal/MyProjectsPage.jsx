import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { ClientDashboardPage } from "@/features/client-portal/ClientDashboardPage";

export function ClientMyProjectsPage() {
  return (
    <ClientPortalLayout
      title="My projects"
      description="Projects shared with your client account."
    >
      <ClientDashboardPage />
    </ClientPortalLayout>
  );
}

import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ClientDashboardPage } from "@/features/client-portal/ClientDashboardPage";

export function ClientMyProjectsPage() {
  useDashboardPageMeta({
    title: "My projects",
    description: "Projects shared with your client account.",
  });

  return <ClientDashboardPage />;
}

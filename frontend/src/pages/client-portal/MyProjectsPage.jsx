import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ClientDashboardPage } from "@/features/client-portal/ClientDashboardPage";

export function ClientMyProjectsPage() {
  useDashboardPageMeta({
    title: "Your projects",
    description:
      "See how your work is going and what needs your attention.",
  });

  return <ClientDashboardPage />;
}

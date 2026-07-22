import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "./DashboardShell";
import { ProjectManagerSidebar } from "./ProjectManagerSidebar";
import {
  DashboardPageMetaProvider,
  useDashboardPageMetaState,
} from "./dashboardPageMeta";

function ProjectManagerLayoutShell() {
  const { user } = useAuth();
  const pageMeta = useDashboardPageMetaState();

  return (
    <DashboardShell
      sidebar={<ProjectManagerSidebar userRole={user?.role} />}
      title={pageMeta.title}
      description={pageMeta.description}
      showPageHeader={pageMeta.showPageHeader ?? Boolean(pageMeta.title)}
      showBack={pageMeta.showBack}
      backLabel={pageMeta.backLabel}
      backTo={pageMeta.backTo}
    >
      <Outlet />
    </DashboardShell>
  );
}

export function ProjectManagerLayout() {
  return (
    <DashboardPageMetaProvider>
      <ProjectManagerLayoutShell />
    </DashboardPageMetaProvider>
  );
}

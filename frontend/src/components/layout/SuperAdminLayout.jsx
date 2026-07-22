import { Outlet } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";
import { SuperAdminSidebar } from "./SuperAdminSidebar";
import {
  DashboardPageMetaProvider,
  useDashboardPageMetaState,
} from "./dashboardPageMeta";

function SuperAdminLayoutShell() {
  const pageMeta = useDashboardPageMetaState();

  return (
    <DashboardShell
      sidebar={<SuperAdminSidebar />}
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

export function SuperAdminLayout() {
  return (
    <DashboardPageMetaProvider>
      <SuperAdminLayoutShell />
    </DashboardPageMetaProvider>
  );
}

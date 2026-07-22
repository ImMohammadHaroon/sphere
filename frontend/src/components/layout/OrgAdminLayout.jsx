import { Outlet } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";
import { OrgAdminSidebar } from "./OrgAdminSidebar";
import {
  DashboardPageMetaProvider,
  useDashboardPageMetaState,
} from "./dashboardPageMeta";

function OrgAdminLayoutShell() {
  const pageMeta = useDashboardPageMetaState();

  return (
    <DashboardShell
      sidebar={<OrgAdminSidebar />}
      dashboardRole="org_admin"
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

export function OrgAdminLayout() {
  return (
    <DashboardPageMetaProvider>
      <OrgAdminLayoutShell />
    </DashboardPageMetaProvider>
  );
}

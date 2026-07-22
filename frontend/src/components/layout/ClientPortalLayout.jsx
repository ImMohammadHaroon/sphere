import { Outlet } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";
import { ClientPortalSidebar } from "./ClientPortalSidebar";
import {
  DashboardPageMetaProvider,
  useDashboardPageMetaState,
} from "./dashboardPageMeta";

function ClientPortalLayoutShell() {
  const pageMeta = useDashboardPageMetaState();

  return (
    <DashboardShell
      sidebar={<ClientPortalSidebar />}
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

export function ClientPortalLayout() {
  return (
    <DashboardPageMetaProvider>
      <ClientPortalLayoutShell />
    </DashboardPageMetaProvider>
  );
}

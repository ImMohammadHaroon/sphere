import { Outlet } from "react-router-dom";
import { DashboardShell } from "./DashboardShell";
import { TeamMemberSidebar } from "./TeamMemberSidebar";
import {
  DashboardPageMetaProvider,
  useDashboardPageMetaState,
} from "./dashboardPageMeta";

function TeamMemberLayoutShell() {
  const pageMeta = useDashboardPageMetaState();

  return (
    <DashboardShell
      sidebar={<TeamMemberSidebar />}
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

export function TeamMemberLayout() {
  return (
    <DashboardPageMetaProvider>
      <TeamMemberLayoutShell />
    </DashboardPageMetaProvider>
  );
}

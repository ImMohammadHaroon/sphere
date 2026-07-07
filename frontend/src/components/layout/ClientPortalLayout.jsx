import { DashboardShell } from "./DashboardShell";
import { ClientPortalSidebar } from "./ClientPortalSidebar";

export function ClientPortalLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<ClientPortalSidebar />}
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

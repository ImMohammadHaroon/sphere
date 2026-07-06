import { DashboardShell } from "./DashboardShell";
import { OrgAdminSidebar } from "./OrgAdminSidebar";

export function OrgAdminLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<OrgAdminSidebar />}
      workspaceLabel="Organization admin"
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

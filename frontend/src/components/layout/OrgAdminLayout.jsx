import { DashboardShell } from "./DashboardShell";
import { OrgAdminSidebar } from "./OrgAdminSidebar";

export function OrgAdminLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<OrgAdminSidebar />}
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

import { DashboardShell } from "./DashboardShell";
import { SuperAdminSidebar } from "./SuperAdminSidebar";

export function SuperAdminLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<SuperAdminSidebar />}
      title={title}
      description={description}
      showPageHeader={Boolean(title)}
    >
      {children}
    </DashboardShell>
  );
}

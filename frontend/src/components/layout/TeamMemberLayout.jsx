import { DashboardShell } from "./DashboardShell";
import { TeamMemberSidebar } from "./TeamMemberSidebar";

export function TeamMemberLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<TeamMemberSidebar />}
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

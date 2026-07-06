import { DashboardShell } from "./DashboardShell";
import { TeamMemberSidebar } from "./TeamMemberSidebar";

export function TeamMemberLayout({ title, description, children }) {
  return (
    <DashboardShell
      sidebar={<TeamMemberSidebar />}
      workspaceLabel="Team Member dashboard"
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

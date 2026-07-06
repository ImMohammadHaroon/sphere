import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "./DashboardShell";
import { ProjectManagerSidebar } from "./ProjectManagerSidebar";

export function ProjectManagerLayout({ title, description, children }) {
  const { user } = useAuth();

  return (
    <DashboardShell
      sidebar={<ProjectManagerSidebar userRole={user?.role} />}
      workspaceLabel="Project Manager dashboard"
      title={title}
      description={description}
    >
      {children}
    </DashboardShell>
  );
}

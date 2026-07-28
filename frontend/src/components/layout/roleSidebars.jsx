import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ProjectManagerSidebar } from "@/components/layout/ProjectManagerSidebar";
import { TeamMemberSidebar } from "@/components/layout/TeamMemberSidebar";
import { ClientPortalSidebar } from "@/components/layout/ClientPortalSidebar";
import { OrgAdminSidebar } from "@/components/layout/OrgAdminSidebar";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";

export function getRoleSidebar(role) {
  switch (role) {
    case "super_admin":
      return <SuperAdminSidebar />;
    case "org_admin":
      return <OrgAdminSidebar />;
    case "project_manager":
      return <ProjectManagerSidebar userRole={role} />;
    case "team_member":
      return <TeamMemberSidebar />;
    case "client":
      return <ClientPortalSidebar />;
    default:
      return <DashboardSidebar userRole={role} />;
  }
}

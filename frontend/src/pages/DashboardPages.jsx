import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ProjectManagerSidebar } from "@/components/layout/ProjectManagerSidebar";
import { TeamMemberSidebar } from "@/components/layout/TeamMemberSidebar";
import { ClientPortalSidebar } from "@/components/layout/ClientPortalSidebar";
import { OrgAdminSidebar } from "@/components/layout/OrgAdminSidebar";
import { SuperAdminSidebar } from "@/components/layout/SuperAdminSidebar";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";
import { getDashboardPath } from "@/lib/authHelpers";

function getProfileSidebar(role) {
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

export function ProfilePage() {
  const { user } = useAuth();
  const homePath = user?.role ? getDashboardPath(user.role) : "/dashboard";

  async function logoutAllDevices() {
    await authApi.logoutAll();
    setAccessToken(null);
    syncLogout();
    window.location.href = "/login";
  }

  return (
    <DashboardShell
      sidebar={getProfileSidebar(user?.role)}
      title="Account settings"
      description="Manage your profile and security preferences."
    >
      <div className="max-w-2xl space-y-6 rounded-lg border border-border bg-surface-raised p-4 shadow-sm sm:p-6">
        <div>
          <p className="text-sm text-text-muted">Name</p>
          <p className="font-medium">{user?.name}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Email</p>
          <p className="break-all font-medium">{user?.email}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Role</p>
          <p className="font-medium capitalize">
            {user?.role.replaceAll("_", " ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink to={homePath} variant="outline">
            Back to dashboard
          </ButtonLink>
          <Button variant="danger" onClick={logoutAllDevices}>
            Log out of all devices
          </Button>
        </div>
      </div>
    </DashboardShell>
  );
}

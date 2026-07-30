import { DashboardShell } from "@/components/layout/DashboardShell";
import { getRoleSidebar } from "@/components/layout/roleSidebars";
import { CommunityChat } from "@/features/community/components/CommunityChat";
import { useAuth } from "@/hooks/useAuth";

export function CommunityChatPage() {
  const { user } = useAuth();

  return (
    <DashboardShell
      sidebar={getRoleSidebar(user?.role)}
      dashboardRole={user?.role}
      showPageHeader={false}
    >
      <div className="-mt-2 max-w-5xl">
        <CommunityChat />
      </div>
    </DashboardShell>
  );
}

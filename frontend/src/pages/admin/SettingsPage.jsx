import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { GeneralSettingsTab } from "@/pages/admin/settings/GeneralSettingsTab";
import { DangerZoneTab } from "@/pages/admin/settings/DangerZoneTab";

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </Card>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-40" />
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const { toast, showToast, dismissToast } = useToast();
  const { data: organization, isLoading, isError, error, refetch, isFetching } =
    useOrgSettings();

  return (
    <OrgAdminLayout
      title="Settings"
      description="Organization details and account management."
    >
      {isLoading ? <SettingsSkeleton /> : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load settings."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && organization ? (
        <div className="space-y-6">
          <GeneralSettingsTab
            organization={organization}
            onSuccess={showToast}
          />
          <DangerZoneTab organization={organization} />
        </div>
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </OrgAdminLayout>
  );
}

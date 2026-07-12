import { useState } from "react";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { GeneralSettingsTab } from "@/pages/admin/settings/GeneralSettingsTab";
import { SecuritySettingsTab } from "@/pages/admin/settings/SecuritySettingsTab";
import { MembersRolesSettingsTab } from "@/pages/admin/settings/MembersRolesSettingsTab";
import { KanbanTemplatesSettingsTab } from "@/pages/admin/settings/KanbanTemplatesSettingsTab";
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
  const [activeTab, setActiveTab] = useState("general");
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="members">Members & roles</TabsTrigger>
            <TabsTrigger value="kanban">Kanban templates</TabsTrigger>
            <TabsTrigger value="danger">Danger zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <GeneralSettingsTab
              organization={organization}
              onSuccess={showToast}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettingsTab
              organization={organization}
              onSuccess={showToast}
            />
          </TabsContent>

          <TabsContent value="members">
            <MembersRolesSettingsTab
              organization={organization}
              onSuccess={showToast}
            />
          </TabsContent>

          <TabsContent value="kanban">
            <KanbanTemplatesSettingsTab onSuccess={showToast} />
          </TabsContent>

          <TabsContent value="danger">
            <DangerZoneTab organization={organization} />
          </TabsContent>
        </Tabs>
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </OrgAdminLayout>
  );
}

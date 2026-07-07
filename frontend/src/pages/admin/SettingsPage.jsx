import { useState } from "react";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import { GeneralSettingsTab } from "@/pages/admin/settings/GeneralSettingsTab";
import { SecuritySettingsTab } from "@/pages/admin/settings/SecuritySettingsTab";
import { MembersRolesSettingsTab } from "@/pages/admin/settings/MembersRolesSettingsTab";
import { DangerZoneTab } from "@/pages/admin/settings/DangerZoneTab";

const SETTINGS_NAV = [
  { value: "general", label: "General" },
  { value: "security", label: "Security" },
  { value: "members", label: "Members & Roles" },
  { value: "danger", label: "Danger zone" },
];

function SettingsSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-col lg:flex-row">
        <div className="space-y-2 border-b border-border p-4 lg:w-56 lg:border-b-0 lg:border-r">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-6 p-4 sm:p-6">
          <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </Card>
          <Card className="space-y-4 p-6">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </Card>
        </div>
      </div>
    </Card>
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
      description="Organization name, branding, and security policy."
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
        <Card className="overflow-hidden p-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            orientation="vertical"
            className="flex flex-col lg:flex-row lg:min-h-[32rem]"
          >
            <nav className="bg-surface lg:bg-transparent">
              <TabsList className="lg:pt-4">
                {SETTINGS_NAV.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </nav>

            <div className="min-w-0 flex-1 p-4 sm:p-6">
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

              <TabsContent value="danger">
                <DangerZoneTab organization={organization} />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </OrgAdminLayout>
  );
}

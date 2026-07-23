import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/hooks/useAccount";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ProfileAccountTab } from "@/features/profile/tabs/ProfileAccountTab";
import { ProfilePasswordTab } from "@/features/profile/tabs/ProfilePasswordTab";
import { ProfileSecurityTab } from "@/features/profile/tabs/ProfileSecurityTab";
import {
  DEFAULT_PROFILE_TAB,
  getProfileTabs,
  isValidProfileTab,
} from "@/features/profile/profileTabs";
import { GeneralSettingsTab } from "@/pages/admin/settings/GeneralSettingsTab";
import { KanbanTemplatesSettingsTab } from "@/pages/admin/settings/KanbanTemplatesSettingsTab";
import { DangerZoneTab } from "@/pages/admin/settings/DangerZoneTab";
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

function OrgSettingsSkeleton() {
  return (
    <Card className="space-y-4 p-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-32" />
    </Card>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isOrgAdmin = user?.role === "org_admin";
  const profileTabs = getProfileTabs(user?.role);

  const tabParam = searchParams.get("tab");
  const activeTab =
    tabParam && isValidProfileTab(user?.role, tabParam)
      ? tabParam
      : DEFAULT_PROFILE_TAB;

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const {
    data: organization,
    isLoading: isOrgLoading,
    isError: isOrgError,
    error: orgError,
    refetch: refetchOrg,
    isFetching: isOrgFetching,
  } = useOrgSettings();

  const [name, setName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
  }, [user]);

  useEffect(() => {
    if (!tabParam || isValidProfileTab(user?.role, tabParam)) return;
    setSearchParams({ tab: DEFAULT_PROFILE_TAB }, { replace: true });
  }, [tabParam, user?.role, setSearchParams]);

  function handleTabChange(nextTab) {
    setSearchParams({ tab: nextTab }, { replace: true });
  }

  async function handleSaveProfile() {
    setProfileError("");
    try {
      await updateProfile.mutateAsync({ name });
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile");
    }
  }

  async function handleAvatarUpload(file) {
    setAvatarError("");
    try {
      await uploadAvatar.mutateAsync(file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to upload photo";
      setAvatarError(message);
      throw err;
    }
  }

  async function handleRemoveAvatar() {
    setAvatarError("");
    try {
      await deleteAvatar.mutateAsync();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Failed to remove photo");
    }
  }

  async function handleChangePassword() {
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    }
  }

  async function handleLogoutAllConfirm() {
    setIsLoggingOut(true);
    try {
      await authApi.logoutAll();
      setAccessToken(null);
      syncLogout();
      window.location.href = "/login";
    } finally {
      setIsLoggingOut(false);
    }
  }

  function renderOrgTabContent() {
    if (isOrgLoading) {
      return <OrgSettingsSkeleton />;
    }

    if (isOrgError) {
      return (
        <Card className="p-6">
          <p className="text-text-secondary">
            {orgError instanceof Error ? orgError.message : "Failed to load organization settings."}
          </p>
          <Button className="mt-4" onClick={() => refetchOrg()} isLoading={isOrgFetching}>
            Retry
          </Button>
        </Card>
      );
    }

    if (!organization) return null;

    if (activeTab === "organization") {
      return (
        <GeneralSettingsTab organization={organization} />
      );
    }

    if (activeTab === "kanban") {
      return <KanbanTemplatesSettingsTab />;
    }

    if (activeTab === "danger") {
      return <DangerZoneTab organization={organization} />;
    }

    return null;
  }

  return (
    <DashboardShell
      sidebar={getProfileSidebar(user?.role)}
      title="Settings"
      description={
        isOrgAdmin
          ? "Manage your account and organization preferences."
          : "Manage your profile and security preferences."
      }
    >
      <div className="max-w-3xl space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList>
            {profileTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <ProfileAccountTab
              user={user}
              name={name}
              onNameChange={setName}
              profileError={profileError}
              avatarError={avatarError}
              onAvatarUpload={handleAvatarUpload}
              onAvatarRemove={handleRemoveAvatar}
              isUploadingAvatar={uploadAvatar.isPending}
              isRemovingAvatar={deleteAvatar.isPending}
              onAvatarError={setAvatarError}
              onSave={handleSaveProfile}
              isSaving={updateProfile.isPending}
            />
          </TabsContent>

          <TabsContent value="password">
            <ProfilePasswordTab
              currentPassword={currentPassword}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              onCurrentPasswordChange={setCurrentPassword}
              onNewPasswordChange={setNewPassword}
              onConfirmPasswordChange={setConfirmPassword}
              passwordError={passwordError}
              onSubmit={handleChangePassword}
              isSubmitting={changePassword.isPending}
            />
          </TabsContent>

          <TabsContent value="security">
            <ProfileSecurityTab onLogoutAll={() => setLogoutAllOpen(true)} />
          </TabsContent>

          {isOrgAdmin ? (
            <>
              <TabsContent value="organization">{renderOrgTabContent()}</TabsContent>
              <TabsContent value="kanban">{renderOrgTabContent()}</TabsContent>
              <TabsContent value="danger">{renderOrgTabContent()}</TabsContent>
            </>
          ) : null}
        </Tabs>
      </div>

      <ConfirmDialog
        open={logoutAllOpen}
        onOpenChange={setLogoutAllOpen}
        title="Log out of all devices"
        description="This will sign you out on every device where you're currently logged in. You'll need to sign in again on each one."
        confirmLabel="Log out everywhere"
        onConfirm={handleLogoutAllConfirm}
        isLoading={isLoggingOut}
      />
    </DashboardShell>
  );
}

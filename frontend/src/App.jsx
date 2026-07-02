import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthInit } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import {
  ForbiddenPage,
  LandingPage,
  NotFoundPage,
} from "@/pages/PublicPages";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { ForgotPasswordPage } from "@/pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/auth/ResetPasswordPage";
import { InvitePage } from "@/pages/auth/InvitePage";
import {
  ClientPortalPage,
  DashboardPage,
  ProfilePage,
} from "@/pages/DashboardPages";
import { PlatformOverviewPage } from "@/pages/super-admin/PlatformOverviewPage";
import { OrganizationsPage } from "@/pages/super-admin/OrganizationsPage";
import { OrganizationDetailPage } from "@/pages/super-admin/OrganizationDetailPage";
import { UsersPage } from "@/pages/super-admin/UsersPage";
import { SuperAdminAuditLogsPage } from "@/pages/super-admin/AuditLogsPage";
import { SuperAdminSettingsPage } from "@/pages/super-admin/SettingsPage";
import { OrgOverviewPage } from "@/pages/admin/OrgOverviewPage";
import { TeamMembersPage } from "@/pages/admin/TeamMembersPage";
import { InviteUserPage } from "@/pages/admin/InviteUserPage";
import { UserDetailPage } from "@/pages/admin/UserDetailPage";
import { AllProjectsPage } from "@/pages/admin/AllProjectsPage";
import { ReportsPage } from "@/pages/admin/ReportsPage";
import { AuditLogsPage } from "@/pages/admin/AuditLogsPage";
import { SettingsPage } from "@/pages/admin/SettingsPage";

const queryClient = new QueryClient();

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["project_manager", "team_member"]}
          >
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <PlatformOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/organizations"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <OrganizationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/organizations/:id"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <OrganizationDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminAuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/settings"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <OrgOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <TeamMembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/invite"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <InviteUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/:id"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <UserDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <AllProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientPortalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

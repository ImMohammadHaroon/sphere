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
  ClientMyProjectsPage,
} from "@/pages/client-portal/MyProjectsPage";
import { ProjectProgressPage } from "@/pages/client-portal/ProjectProgressPage";
import { ClientMilestonesPage } from "@/pages/client-portal/MilestonesPage";
import { ClientReportsPage } from "@/pages/client-portal/ReportsPage";
import { MyProjectsOverviewPage } from "@/pages/project-manager/MyProjectsOverviewPage";
import { CreateProjectPage } from "@/pages/project-manager/CreateProjectPage";
import { KanbanBoardPage as PmKanbanBoardPage } from "@/pages/project-manager/KanbanBoardPage";
import { TaskDetailPage as PmTaskDetailPage } from "@/pages/project-manager/TaskDetailPage";
import { CalendarViewPage } from "@/pages/project-manager/CalendarViewPage";
import { ProjectManagerReportsPage } from "@/pages/project-manager/ReportsPage";
import { ProjectTeamPage } from "@/pages/project-manager/ProjectTeamPage";
import { MilestonesPage as PmMilestonesPage } from "@/pages/project-manager/MilestonesPage";
import { MyTasksPage } from "@/pages/team-member/MyTasksPage";
import { TeamMemberKanbanBoardPage } from "@/pages/team-member/KanbanBoardPage";
import { TeamMemberTaskDetailPage } from "@/pages/team-member/TaskDetailPage";
import { NotificationsPage } from "@/pages/team-member/NotificationsPage";
import { ProfilePage } from "@/pages/DashboardPages";
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
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <MyProjectsOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/projects/new"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <CreateProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/kanban"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <PmKanbanBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <PmTaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <CalendarViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/reports"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <ProjectManagerReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/team"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <ProjectTeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/milestones"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <PmMilestonesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={["team_member"]}>
            <MyTasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/kanban"
        element={
          <ProtectedRoute allowedRoles={["team_member"]}>
            <TeamMemberKanbanBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={["team_member"]}>
            <TeamMemberTaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/member/notifications"
        element={
          <ProtectedRoute allowedRoles={["team_member"]}>
            <NotificationsPage />
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
            <ClientMyProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/progress"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ProjectProgressPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/milestones"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientMilestonesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portal/reports"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientReportsPage />
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

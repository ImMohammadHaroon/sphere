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
import { VerifyOrgRegistrationPage } from "@/pages/auth/VerifyOrgRegistrationPage";
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
import { ProjectDetailPage } from "@/pages/project-manager/ProjectDetailPage";
import { KanbanBoardPage as PmKanbanBoardPage } from "@/pages/project-manager/KanbanBoardPage";
import { TaskDetailPage } from "@/pages/tasks/TaskDetailPage";
import { CalendarViewPage } from "@/pages/project-manager/CalendarViewPage";
import { ProjectManagerReportsPage } from "@/pages/project-manager/ReportsPage";
import { MilestonesPage as PmMilestonesPage } from "@/pages/project-manager/MilestonesPage";
import { MyTasksPage } from "@/pages/team-member/MyTasksPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { TeamMemberKanbanBoardPage } from "@/pages/team-member/KanbanBoardPage";
import { TeamMemberTaskDetailPage } from "@/pages/team-member/TaskDetailPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PlatformOverviewPage } from "@/pages/super-admin/PlatformOverviewPage";
import { OrganizationsPage } from "@/pages/super-admin/OrganizationsPage";
import { OrganizationDetailPage } from "@/pages/super-admin/OrganizationDetailPage";
import { UsersPage } from "@/pages/super-admin/UsersPage";
import { SuperAdminReportsPage } from "@/pages/super-admin/ReportsPage";
import { OrgOverviewPage } from "@/pages/admin/OrgOverviewPage";
import { AwaitingApprovalPage } from "@/pages/admin/AwaitingApprovalPage";
import { TeamMembersPage } from "@/pages/admin/TeamMembersPage";
import { UserDetailPage } from "@/pages/admin/UserDetailPage";
import { AllProjectsPage } from "@/pages/admin/AllProjectsPage";
import { ReportsPage } from "@/pages/admin/ReportsPage";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { TeamMemberLayout } from "@/components/layout/TeamMemberLayout";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";

const queryClient = new QueryClient();

function AppRoutes() {
  useAuthInit();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/verify" element={<VerifyOrgRegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />

      <Route
        path="/awaiting-approval"
        element={
          <ProtectedRoute>
            <AwaitingApprovalPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["project_manager"]}>
            <ProjectManagerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MyProjectsOverviewPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="projects/:id/board" element={<PmKanbanBoardPage />} />
        <Route path="projects/:id/calendar" element={<CalendarViewPage />} />
        <Route path="projects/:id/milestones" element={<PmMilestonesPage />} />
        <Route path="projects/:id/reports" element={<ProjectManagerReportsPage />} />
        <Route path="kanban" element={<PmKanbanBoardPage />} />
        <Route
          path="projects/:projectId/tasks/:taskId"
          element={<TaskDetailPage />}
        />
        <Route path="calendar" element={<CalendarViewPage />} />
        <Route path="reports" element={<ProjectManagerReportsPage />} />
        <Route path="milestones" element={<PmMilestonesPage />} />
        <Route
          path="notifications"
          element={<Navigate to="/notifications" replace />}
        />
      </Route>
      <Route
        path="/member"
        element={
          <ProtectedRoute allowedRoles={["team_member"]}>
            <TeamMemberLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<MyTasksPage />} />
        <Route
          path="projects/:projectId/board"
          element={<TeamMemberKanbanBoardPage />}
        />
        <Route
          path="projects/:projectId/tasks/:taskId"
          element={<TeamMemberTaskDetailPage />}
        />
        <Route
          path="notifications"
          element={<Navigate to="/notifications" replace />}
        />
      </Route>
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={["super_admin"]}>
            <SuperAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PlatformOverviewPage />} />
        <Route path="organizations" element={<OrganizationsPage />} />
        <Route
          path="organizations/pending"
          element={<Navigate to="/super-admin/organizations" replace />}
        />
        <Route path="organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<SuperAdminReportsPage />} />
        <Route
          path="notifications"
          element={<Navigate to="/notifications" replace />}
        />
      </Route>
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["org_admin"]}>
            <OrgAdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrgOverviewPage />} />
        <Route path="users" element={<TeamMembersPage />} />
        <Route
          path="users/invite"
          element={<Navigate to="/admin/users" replace />}
        />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="projects" element={<AllProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route
          path="projects/:projectId/tasks/:taskId"
          element={<TaskDetailPage />}
        />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="settings"
          element={<Navigate to="/profile?tab=organization" replace />}
        />
        <Route
          path="notifications"
          element={<Navigate to="/notifications" replace />}
        />
      </Route>
      <Route
        path="/portal"
        element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientPortalLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientMyProjectsPage />} />
        <Route path="progress" element={<ProjectProgressPage />} />
        <Route path="milestones" element={<ClientMilestonesPage />} />
        <Route path="reports" element={<ClientReportsPage />} />
        <Route
          path="notifications"
          element={<Navigate to="/notifications" replace />}
        />
      </Route>
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
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

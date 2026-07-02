import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

function DashboardShell({ title, description }) {
  const { user } = useAuth();
  const { data: projects, isLoading, isError, error, refetch, isFetching } =
    useProjects();

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      syncLogout();
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <DashboardSidebar userRole={user?.role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-surface-raised">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-text-secondary">{user?.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link to="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-10">
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-text-secondary">{description}</p>

          <div className="mt-8">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : null}

            {isError ? (
              <Card className="p-6">
                <p className="text-text-secondary">
                  {error instanceof Error ? error.message : "Failed to load projects."}
                </p>
                <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
                  Retry
                </Button>
              </Card>
            ) : null}

            {!isLoading && !isError && projects ? (
              projects.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-text-secondary">
                    No projects in your organization yet.
                  </p>
                </Card>
              ) : (
                <Card className="overflow-hidden p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project._id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.status === "active" ? "success" : "muted"
                              }
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {project.description || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <DashboardShell
      title="Dashboard"
      description="Your organization's projects."
    />
  );
}

export function ClientPortalPage() {
  return (
    <DashboardShell
      title="Client portal"
      description="Projects linked to your client account."
    />
  );
}

export function ProfilePage() {
  const { user } = useAuth();

  async function logoutAllDevices() {
    await authApi.logoutAll();
    setAccessToken(null);
    syncLogout();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-surface lg:flex">
      <DashboardSidebar userRole={user?.role} />
      <div className="flex-1 px-6 py-10 lg:px-10">
        <h1 className="text-3xl font-semibold">Account settings</h1>
        <p className="mt-2 text-text-secondary">
          Manage your profile and security preferences.
        </p>

        <div className="mt-8 max-w-2xl space-y-6 rounded-lg border border-border bg-surface-raised p-6 shadow-sm">
          <div>
            <p className="text-sm text-text-muted">Name</p>
            <p className="font-medium">{user?.name}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Role</p>
            <p className="font-medium capitalize">
              {user?.role.replaceAll("_", " ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <ButtonLink
              to={user ? `/dashboard` : "/dashboard"}
              variant="outline"
            >
              Back to dashboard
            </ButtonLink>
            <Button variant="danger" onClick={logoutAllDevices}>
              Log out of all devices
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

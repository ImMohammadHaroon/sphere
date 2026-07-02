import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";
import { SuperAdminSidebar } from "./SuperAdminSidebar";

export function SuperAdminLayout({
  title,
  description,
  children,
}) {
  const { user } = useAuth();

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
      <SuperAdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-surface-raised">
          <div className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Super Admin
              </p>
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
          {title ? (
            <div className="mb-8">
              <h1 className="text-3xl font-semibold">{title}</h1>
              {description ? (
                <p className="mt-2 text-text-secondary">{description}</p>
              ) : null}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

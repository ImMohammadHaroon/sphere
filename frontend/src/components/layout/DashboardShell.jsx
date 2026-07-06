import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";
import { cn } from "@/lib/utils";

export function DashboardShell({
  sidebar,
  workspaceLabel,
  title,
  description,
  children,
  showPageHeader = true,
}) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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
    <div className="min-h-screen bg-surface">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="lg:flex lg:min-h-screen">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:shrink-0 lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="relative h-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Close navigation"
              className="absolute right-2 top-2 z-10 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {sidebar}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Open navigation"
                  className="shrink-0 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="min-w-0">
                  {workspaceLabel ? (
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      {workspaceLabel}
                    </p>
                  ) : null}
                  <p className="truncate text-sm text-text-secondary">{user?.email}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Sign out
                </Button>
              </div>            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            {showPageHeader && title ? (
              <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
                {description ? (
                  <p className="mt-2 text-sm text-text-secondary sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { authApi } from "@/lib/authApi";
import { syncLogout } from "@/lib/authSync";
import { useAuth } from "@/hooks/useAuth";

export function AwaitingApprovalPage() {
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const status = user?.organizationVerificationStatus ?? "pending";
  const isRejected = status === "rejected";
  const reason = user?.organizationVerificationRejectionReason;

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Clear local session even if the API call fails.
    } finally {
      syncLogout();
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="mb-8 text-center">
        <Link
          to="/"
          className="font-display text-xl font-semibold text-text-primary hover:text-primary"
        >
          ProjectSphere
        </Link>
      </div>

      <Card className="w-full max-w-lg p-8 text-center">
        <h1 className="font-display text-2xl font-semibold text-text-primary">
          {isRejected ? "Registration not approved" : "Awaiting approval"}
        </h1>

        {isRejected ? (
          <div className="mt-4 space-y-3 text-text-secondary">
            <p>Your organization registration was not approved.</p>
            {reason ? (
              <p className="rounded-lg bg-surface px-4 py-3 text-sm text-text-primary">
                <span className="font-medium">Reason:</span> {reason}
              </p>
            ) : null}
            <p className="text-sm">
              If you believe this was a mistake, please contact support.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-text-secondary">
            Your organization is awaiting Super Admin approval. We&apos;ll email you
            once it&apos;s reviewed.
          </p>
        )}

        <Button
          className="mt-8"
          variant="outline"
          onClick={handleLogout}
          isLoading={isLoggingOut}
        >
          Log out
        </Button>
      </Card>
    </div>
  );
}

import { ButtonLink } from "@/components/ui/ButtonLink";
import { NotFound as GhostNotFound } from "@/components/ui/ghost-404-page";
import { LandingPage } from "@/features/landing/LandingPage";

export { LandingPage };

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-sm text-text-muted">403</p>
      <h1 className="mt-2 text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 text-text-secondary">
        You do not have permission to view this page.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/dashboard" variant="outline">
          Go to dashboard
        </ButtonLink>
        <ButtonLink to="/login">Sign in</ButtonLink>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return <GhostNotFound />;
}

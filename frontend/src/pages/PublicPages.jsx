import { ButtonLink } from "@/components/ui/ButtonLink";
import { PublicHeader } from "@/components/layout/PublicHeader";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:py-16">
        <section className="max-w-2xl">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
            Organize projects, tasks, and teams in one calm workspace.
          </h1>
          <p className="mt-4 text-base text-text-secondary sm:mt-6 sm:text-lg">
            ProjectSphere helps organizations manage work with strict tenant
            isolation, secure authentication, and role-based dashboards for every
            stakeholder.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/login" size="lg">
              Sign in
            </ButtonLink>
            <ButtonLink to="/register" size="lg" variant="outline">
              Create organization
            </ButtonLink>
          </div>
        </section>
      </main>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
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
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="font-mono text-sm text-text-muted">404</p>
      <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" variant="outline">
          Back home
        </ButtonLink>
        <ButtonLink to="/login">Sign in</ButtonLink>
      </div>
    </div>
  );
}

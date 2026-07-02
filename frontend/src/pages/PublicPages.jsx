import { ButtonLink } from "@/components/ui/ButtonLink";
import { NavCard } from "@/components/ui/NavCard";
import { PublicHeader } from "@/components/layout/PublicHeader";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <section className="max-w-2xl">
          <p className="mb-4 inline-flex rounded-full bg-primary-subtle px-3 py-1 text-sm font-medium text-primary">
            Multi-tenant project management
          </p>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Organize projects, tasks, and teams in one calm workspace.
          </h1>
          <p className="mt-6 text-lg text-text-secondary">
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

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Authentication</h2>
          <p className="mt-2 text-text-secondary">
            Sign in or create an account to access your workspace.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard
              title="Sign in"
              description="Access your organization with email and password."
              to="/login"
              badge="Auth"
              accent="primary"
            />
            <NavCard
              title="Register organization"
              description="Create a new company workspace and become Org Admin."
              to="/register"
              badge="New org"
              accent="primary"
            />
            <NavCard
              title="Forgot password"
              description="Request a secure reset link for your account."
              to="/forgot-password"
              badge="Recovery"
              accent="neutral"
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Role dashboards</h2>
          <p className="mt-2 text-text-secondary">
            Each role has its own dashboard. Sign in to open yours — protected
            routes redirect to login when needed.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NavCard
              title="Org Admin"
              description="Manage users, projects, settings, and org analytics."
              to="/admin"
              badge="Organization"
              accent="primary"
            />
            <NavCard
              title="Project Manager"
              description="Kanban boards, tasks, milestones, and team reports."
              to="/dashboard"
              badge="Projects"
              accent="accent"
            />
            <NavCard
              title="Team Member"
              description="Assigned tasks, board updates, and notifications."
              to="/dashboard"
              badge="Tasks"
              accent="neutral"
            />
            <NavCard
              title="Client portal"
              description="Read-only progress view and milestone approvals."
              to="/portal"
              badge="External"
              accent="primary"
            />
            <NavCard
              title="Account profile"
              description="Update settings and log out of all devices."
              to="/profile"
              badge="Account"
              accent="neutral"
            />
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

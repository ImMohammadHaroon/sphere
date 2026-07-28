import { Link } from "react-router-dom";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-landing-display text-lg font-semibold text-text-primary">
            ProjectSphere
          </p>
          <p className="mt-2 max-w-xs text-sm text-text-secondary">
            Multi-tenant project management with custom workflows and real-time
            collaboration.
          </p>
        </div>

        <nav
          className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
          aria-label="Footer"
        >
          <a
            href="/#pricing"
            className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Pricing
          </a>
          <Link
            to="/register"
            className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Sign in
          </Link>
        </nav>
      </div>

      <p className="mt-8 font-mono text-xs text-text-muted">
        © {year} ProjectSphere
      </p>
    </footer>
  );
}

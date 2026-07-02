import { Link } from "react-router-dom";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-6">
        <div className="w-full">
          <div className="mb-8 text-center">
            <Link
              to="/"
              className="font-display text-xl font-semibold text-text-primary hover:text-primary"
            >
              ProjectSphere
            </Link>
            <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
            <p className="mt-2 text-text-secondary">{description}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-6 shadow-sm">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

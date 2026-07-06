import { Link } from "react-router-dom";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-surface">
      <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center p-4 sm:p-6">
        <div className="w-full">
          <div className="mb-6 text-center sm:mb-8">
            <Link
              to="/"
              className="font-display text-xl font-semibold text-text-primary hover:text-primary"
            >
              ProjectSphere
            </Link>
            <h1 className="mt-4 text-2xl font-semibold sm:mt-6 sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-text-secondary sm:text-base">{description}</p>
          </div>

          <div className="rounded-lg border border-border bg-surface-raised p-4 shadow-sm sm:p-6">
            {children}
          </div>

          {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}

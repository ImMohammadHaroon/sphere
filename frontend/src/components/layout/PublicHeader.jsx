import { ButtonLink } from "@/components/ui/ButtonLink";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface-raised/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <ButtonLink to="/" variant="ghost" className="px-0 font-display text-xl font-semibold hover:bg-transparent">
          ProjectSphere
        </ButtonLink>
        <div className="flex items-center gap-2 sm:gap-3">
          <ButtonLink to="/login" variant="ghost" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink to="/register" size="sm">
            Get started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}

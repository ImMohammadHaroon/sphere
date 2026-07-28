import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Roles", href: "/#roles" },
  { label: "Security", href: "/#security" },
];

function NavLink({ href, label, onClick, className }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-card-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
    >
      {label}
    </a>
  );
}

const signInButtonClassName =
  "border-transparent bg-text-primary text-white hover:bg-text-primary/90 hover:text-white";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  const navLinks = isLanding
    ? NAV_LINKS
    : NAV_LINKS.map((link) => ({
        ...link,
        href: `/${link.href.replace(/^\//, "")}`,
      }));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm transition-shadow duration-200",
        scrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <Link
          to="/"
          className="font-display text-xl font-semibold text-text-primary transition-opacity hover:opacity-90"
        >
          ProjectSphere
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <NavLink key={link.href} href={link.href} label={link.label} />
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink
            to="/login"
            size="sm"
            className={signInButtonClassName}
          >
            Sign in
          </ButtonLink>
          <ButtonLink to="/register" size="sm">
            Get started
          </ButtonLink>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:bg-card-hover md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-background md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                label={link.label}
                onClick={closeMobile}
                className="px-2"
              />
            ))}
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              <ButtonLink
                to="/login"
                className={cn("w-full", signInButtonClassName)}
              >
                Sign in
              </ButtonLink>
              <ButtonLink to="/register" className="w-full">
                Get started
              </ButtonLink>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

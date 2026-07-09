import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function ProfileMenu({ user, onLogout, roleLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { pathname } = useLocation();

  const displayName = user?.name?.trim() || null;
  const buttonLabel = displayName || "Profile";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    onLogout();
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="max-w-[120px] truncate sm:max-w-[180px]">
          {buttonLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-text-secondary transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface-raised py-2 shadow-sm">
          <div className="px-4 py-2">
            <p className="truncate font-semibold text-text-primary">
              {displayName || roleLabel}
            </p>
            {user?.email ? (
              <p className="mt-0.5 truncate text-sm text-text-secondary">
                {user.email}
              </p>
            ) : null}
          </div>
          <hr className="border-border" />
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-surface"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

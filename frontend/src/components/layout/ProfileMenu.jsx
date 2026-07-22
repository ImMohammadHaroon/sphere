import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function ProfileMenu({ user, onLogout, roleLabel }) {
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const containerRef = useRef(null);
  const { pathname } = useLocation();

  const displayName = user?.name?.trim() || null;

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

  function handleSignOutClick() {
    setOpen(false);
    setLogoutOpen(true);
  }

  async function handleSignOutConfirm() {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="h-9 w-9 rounded-full p-0"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={displayName ? `${displayName} menu` : "Profile menu"}
      >
        <UserAvatar user={user} size="sm" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-surface-raised py-2 shadow-sm">
          <div className="flex items-center gap-3 px-4 py-2">
            <UserAvatar user={user} size="md" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary">
                {displayName || roleLabel}
              </p>
              {user?.email ? (
                <p className="mt-0.5 truncate text-sm text-text-secondary">
                  {user.email}
                </p>
              ) : null}
            </div>
          </div>
          <hr className="border-border" />
          <Link
            to="/profile"
            className="block w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-card-hover"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={handleSignOutClick}
            className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-card-hover"
          >
            Sign out
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Sign out"
        description="Are you sure you want to sign out of your account on this device?"
        confirmLabel="Sign out"
        onConfirm={handleSignOutConfirm}
        isLoading={isLoggingOut}
      />
    </div>
  );
}

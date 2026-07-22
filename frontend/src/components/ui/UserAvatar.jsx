import { useEffect, useState } from "react";
import { authApi } from "@/lib/authApi";
import { cn } from "@/lib/utils";

function getInitials(name) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-24 w-24 text-2xl",
};

export function UserAvatar({ user, size = "sm", className }) {
  const [src, setSrc] = useState(null);
  const initials = getInitials(user?.name);

  useEffect(() => {
    if (!user?.hasAvatar) {
      setSrc(null);
      return undefined;
    }

    let objectUrl;
    let cancelled = false;

    authApi
      .getAvatarBlob(user.avatarUpdatedAt)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setSrc(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [user?.hasAvatar, user?.avatarUpdatedAt]);

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-subtle font-semibold text-primary",
        sizeClasses[size],
        className
      )}
      aria-hidden={!user?.name}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

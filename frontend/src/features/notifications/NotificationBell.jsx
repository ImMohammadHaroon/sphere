import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/hooks/useNotifications";
import { formatNotificationMessage } from "@/features/notifications/notificationMessages";

function formatTimestamp(value) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationBell({ viewAllPath, buildNotificationPath }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

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

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }

    setOpen(false);

    if (buildNotificationPath) {
      const path = buildNotificationPath(notification);
      if (path) {
        navigate(path);
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="relative bg-text-primary px-2.5 text-white hover:bg-text-primary/90 hover:text-white"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 shrink-0" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-surface-raised shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">
              Notifications
            </p>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className={cn(
                "text-xs font-medium text-primary hover:underline",
                unreadCount === 0 && "cursor-not-allowed opacity-50 hover:no-underline"
              )}
            >
              Mark all as read
            </button>
          </div>

          {recentNotifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              You&apos;re all caught up
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {recentNotifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full bg-card px-4 py-3 text-left transition-colors hover:bg-card-hover",
                      !notification.read && "bg-primary-subtle/40"
                    )}
                  >
                    <p className="text-sm text-text-primary">
                      {formatNotificationMessage(notification)}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-border px-4 py-3">
            <Link
              to={viewAllPath}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  useNotifications,
  useNotificationsPage,
} from "@/features/notifications/hooks/useNotifications";
import { formatNotificationMessage } from "@/features/notifications/notificationMessages";

function formatTimestamp(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NotificationsPageContent({ buildNotificationPath }) {
  const navigate = useNavigate();
  const { markAsRead, markAllAsRead } = useNotifications();
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    hasMore,
    isFetchingMore,
    fetchMore,
  } = useNotificationsPage();

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  async function handleMarkAsRead(notification) {
    if (notification.read) return;
    try {
      await markAsRead(notification.id);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleNotificationClick(notification) {
    await handleMarkAsRead(notification);

    if (buildNotificationPath) {
      const path = buildNotificationPath(notification);
      if (path) {
        navigate(path);
      }
    }
  }

  if (isLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "All caught up"}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          Mark all as read
        </Button>
      </div>

      {isError ? (
        <p className="text-sm text-text-secondary">
          Unable to load notifications right now.
        </p>
      ) : notifications.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-text-secondary">You&apos;re all caught up</p>
        </div>
      ) : (
        <ul className="divide-hover">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <button
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-start gap-3">
                  {!notification.read ? (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-hidden
                    />
                  ) : (
                    <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">
                      {formatNotificationMessage(notification)}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {formatTimestamp(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </button>

              <div className="flex shrink-0 items-center gap-2 pl-5 sm:pl-0">
                {notification.read ? (
                  <Badge variant="muted">Read</Badge>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchMore()}
            isLoading={isFetchingMore}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

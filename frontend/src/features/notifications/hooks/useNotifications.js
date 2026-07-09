import { useEffect } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationsApi";
import { createSocket } from "@/lib/socket";
import { useAuth } from "@/hooks/useAuth";

const EMPTY_LIST = {
  notifications: [],
  unreadCount: 0,
  page: 1,
  hasMore: false,
};

function notificationsQueryKey(userId) {
  return ["notifications", userId];
}

function notificationsPagesQueryKey(userId) {
  return ["notifications", "pages", userId];
}

export function useNotifications() {
  const { isAuthenticated, user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: () => listNotifications(1),
    staleTime: 30_000,
    enabled: isAuthenticated && !!userId,
  });

  useEffect(() => {
    if (!accessToken || !userId) {
      return undefined;
    }

    const socket = createSocket(accessToken);

    function handleNewNotification(notification) {
      queryClient.setQueryData(notificationsQueryKey(userId), (current) => {
        const base = current ?? EMPTY_LIST;
        const exists = base.notifications.some((item) => item.id === notification.id);
        if (exists) {
          return base;
        }

        return {
          ...base,
          notifications: [notification, ...base.notifications],
          unreadCount: (base.unreadCount ?? 0) + 1,
        };
      });

      queryClient.setQueryData(notificationsPagesQueryKey(userId), (current) => {
        if (!current?.pages?.length) {
          return current;
        }

        const firstPage = current.pages[0];
        const exists = firstPage.notifications.some(
          (item) => item.id === notification.id
        );
        if (exists) {
          return current;
        }

        const nextPages = [...current.pages];
        nextPages[0] = {
          ...firstPage,
          notifications: [notification, ...firstPage.notifications],
          unreadCount: (firstPage.unreadCount ?? 0) + 1,
        };

        return {
          ...current,
          pages: nextPages,
        };
      });
    }

    socket.on("notification:new", handleNewNotification);
    socket.connect();

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.disconnect();
    };
  }, [accessToken, userId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (result) => {
      const updated = result.notification;

      queryClient.setQueryData(notificationsQueryKey(userId), (current) => {
        if (!current) {
          return current;
        }

        const previous = current.notifications.find(
          (item) => item.id === updated.id
        );
        const wasUnread = previous && !previous.read;

        return {
          ...current,
          notifications: current.notifications.map((item) =>
            item.id === updated.id ? updated : item
          ),
          unreadCount: wasUnread
            ? Math.max(0, (current.unreadCount ?? 0) - 1)
            : current.unreadCount,
        };
      });

      queryClient.invalidateQueries({
        queryKey: notificationsPagesQueryKey(userId),
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.setQueryData(notificationsQueryKey(userId), (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          notifications: current.notifications.map((item) => ({
            ...item,
            read: true,
          })),
          unreadCount: 0,
        };
      });

      queryClient.invalidateQueries({
        queryKey: notificationsPagesQueryKey(userId),
      });
    },
  });

  const data = query.data ?? EMPTY_LIST;

  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    markAsRead: (id) => markAsReadMutation.mutateAsync(id),
    markAllAsRead: () => markAllAsReadMutation.mutateAsync(),
    refetch: query.refetch,
  };
}

export function useNotificationsPage() {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;

  const query = useInfiniteQuery({
    queryKey: notificationsPagesQueryKey(userId),
    queryFn: ({ pageParam }) => listNotifications(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
    enabled: isAuthenticated && !!userId,
  });

  const pages = query.data?.pages ?? [];
  const notifications = pages.flatMap((page) => page.notifications ?? []);
  const unreadCount = pages[0]?.unreadCount ?? 0;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    hasMore: !!query.hasNextPage,
    isFetchingMore: query.isFetchingNextPage,
    fetchMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}

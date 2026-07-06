import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPlatformAuditLogs } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformAuditLogs(filters = {}) {
  const { isAuthenticated, user } = useAuth();
  const {
    page = 1,
    limit = 10,
    action,
    organizationId,
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: [
      "platform",
      "audit-logs",
      { page, limit, action, organizationId, startDate, endDate },
    ],
    queryFn: () =>
      listPlatformAuditLogs({
        page,
        limit,
        action,
        organizationId,
        startDate,
        endDate,
      }),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

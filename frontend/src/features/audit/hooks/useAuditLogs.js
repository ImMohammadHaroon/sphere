import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/auditApi";
import { useAuth } from "@/hooks/useAuth";

export function useAuditLogs(filters = {}) {
  const { isAuthenticated, user } = useAuth();
  const { page = 1, limit = 10, action, startDate, endDate } = filters;

  return useQuery({
    queryKey: [
      "org",
      "audit-logs",
      user?.organizationId,
      { page, limit, action, startDate, endDate },
    ],
    queryFn: () =>
      listAuditLogs({ page, limit, action, startDate, endDate }),
    staleTime: 15_000,
    enabled: isAuthenticated && user?.role === "org_admin",
    placeholderData: (previousData) => previousData,
  });
}

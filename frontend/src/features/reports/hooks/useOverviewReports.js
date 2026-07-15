import { useQuery } from "@tanstack/react-query";
import {
  getOrgReportsOverview,
  getPlatformReportsOverview,
} from "@/lib/reportsApi";
import { useAuth } from "@/hooks/useAuth";

export function useOrgReportsOverview() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["reports", "org-overview", user?.organizationId],
    queryFn: getOrgReportsOverview,
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "org_admin",
  });
}

export function usePlatformReportsOverview() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["reports", "platform-overview"],
    queryFn: getPlatformReportsOverview,
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

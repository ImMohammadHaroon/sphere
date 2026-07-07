import { useQuery } from "@tanstack/react-query";
import { getOrgOverview } from "@/lib/orgApi";
import { useAuth } from "@/hooks/useAuth";

export function useOrgOverview() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["org", "overview", user?.organizationId],
    queryFn: getOrgOverview,
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "org_admin",
  });
}

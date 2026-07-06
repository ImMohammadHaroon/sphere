import { useQuery } from "@tanstack/react-query";
import { getOrganizationDetail } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function useOrganizationDetail(id) {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "organizations", id],
    queryFn: () => getOrganizationDetail(id),
    staleTime: 30_000,
    enabled: isAuthenticated && user?.role === "super_admin" && Boolean(id),
  });
}

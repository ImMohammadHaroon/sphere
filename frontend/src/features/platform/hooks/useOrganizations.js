import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listOrganizations } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function useOrganizations(filters) {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "organizations", filters],
    queryFn: () => listOrganizations(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

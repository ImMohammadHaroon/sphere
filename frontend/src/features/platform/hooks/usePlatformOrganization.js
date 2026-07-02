import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformOrganization(id) {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "organizations", id],
    queryFn: async () => {
      const result = await getOrganization(id);
      return result.organization;
    },
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "super_admin" && !!id,
  });
}

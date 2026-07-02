import { useQuery } from "@tanstack/react-query";
import { listOrganizations } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformOrganizations() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "organizations"],
    queryFn: async () => {
      const result = await listOrganizations();
      return result.organizations;
    },
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

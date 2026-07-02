import { useQuery } from "@tanstack/react-query";
import { getPlatformOverview } from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformOverview() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "overview"],
    queryFn: getPlatformOverview,
    staleTime: 60_000,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

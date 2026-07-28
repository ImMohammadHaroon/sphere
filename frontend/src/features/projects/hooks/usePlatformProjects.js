import { useQuery } from "@tanstack/react-query";
import { getPlatformProjects } from "@/lib/reportsApi";
import { useAuth } from "@/hooks/useAuth";

export function usePlatformProjects({ search, organizationId, page = 1, limit = 100 } = {}) {
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return useQuery({
    queryKey: [
      "platform-projects",
      search ?? "",
      organizationId ?? "",
      page,
      limit,
    ],
    queryFn: async () => {
      const result = await getPlatformProjects({
        page,
        limit,
        search,
        organizationId,
      });
      return result;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && isSuperAdmin,
  });
}

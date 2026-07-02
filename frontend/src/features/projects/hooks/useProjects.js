import { useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/projectsApi";
import { useAuth } from "@/hooks/useAuth";

export function useProjects() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId &&
    user.role !== "super_admin";

  return useQuery({
    queryKey: ["projects", user?.organizationId],
    queryFn: async () => {
      const result = await listProjects();
      return result.projects;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg,
  });
}

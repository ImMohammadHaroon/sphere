import { useQuery } from "@tanstack/react-query";
import { getProjectCalendar } from "@/lib/projectsApi";
import { useAuth } from "@/hooks/useAuth";

export function useProjectCalendar(projectId, monthStart) {
  const { isAuthenticated, user } = useAuth();
  const hasOrg = !!user?.organizationId && user.role !== "super_admin";

  return useQuery({
    queryKey: ["calendar", user?.organizationId, projectId, monthStart],
    queryFn: async () => {
      const result = await getProjectCalendar(
        projectId,
        monthStart.start,
        monthStart.end
      );
      return result;
    },
    staleTime: 30_000,
    enabled:
      isAuthenticated && hasOrg && !!projectId && !!monthStart?.start && !!monthStart?.end,
  });
}

import { useQuery } from "@tanstack/react-query";
import {
  getBurndownReport,
  getVelocityReport,
  getWorkloadReport,
} from "@/lib/reportsApi";
import { useAuth } from "@/hooks/useAuth";

function useOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

export function useBurndownReport(projectId) {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["reports", "burndown", user?.organizationId, projectId],
    queryFn: () => getBurndownReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

export function useVelocityReport(projectId) {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["reports", "velocity", user?.organizationId, projectId],
    queryFn: () => getVelocityReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

export function useWorkloadReport(projectId) {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["reports", "workload", user?.organizationId, projectId],
    queryFn: () => getWorkloadReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!projectId,
  });
}

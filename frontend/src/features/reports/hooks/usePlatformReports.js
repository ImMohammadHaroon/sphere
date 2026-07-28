import { useQuery } from "@tanstack/react-query";
import {
  getPlatformBurndownReport,
  getPlatformVelocityReport,
  getPlatformWorkloadReport,
} from "@/lib/reportsApi";
import { useAuth } from "@/hooks/useAuth";

function useSuperAdminContext() {
  const { isAuthenticated, user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  return { isAuthenticated, isSuperAdmin };
}

export function usePlatformBurndownReport(projectId) {
  const { isAuthenticated, isSuperAdmin } = useSuperAdminContext();

  return useQuery({
    queryKey: ["reports", "platform", "burndown", projectId],
    queryFn: () => getPlatformBurndownReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && isSuperAdmin && !!projectId,
  });
}

export function usePlatformVelocityReport(projectId) {
  const { isAuthenticated, isSuperAdmin } = useSuperAdminContext();

  return useQuery({
    queryKey: ["reports", "platform", "velocity", projectId],
    queryFn: () => getPlatformVelocityReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && isSuperAdmin && !!projectId,
  });
}

export function usePlatformWorkloadReport(projectId) {
  const { isAuthenticated, isSuperAdmin } = useSuperAdminContext();

  return useQuery({
    queryKey: ["reports", "platform", "workload", projectId],
    queryFn: () => getPlatformWorkloadReport(projectId),
    staleTime: 30_000,
    enabled: isAuthenticated && isSuperAdmin && !!projectId,
  });
}

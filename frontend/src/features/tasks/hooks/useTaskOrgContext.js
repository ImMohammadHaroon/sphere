import { useAuth } from "@/hooks/useAuth";

export function useTaskOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

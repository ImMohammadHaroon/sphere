import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listOrgUsers, removeOrgUser } from "@/lib/orgApi";
import { useAuth } from "@/hooks/useAuth";

export function useOrgUsers() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["org", "users", user?.organizationId],
    queryFn: async () => {
      const result = await listOrgUsers();
      return result.users;
    },
    staleTime: 30_000,
    enabled:
      isAuthenticated &&
      (user?.role === "org_admin" || user?.role === "project_manager"),
  });
}

export function useRemoveOrgUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: removeOrgUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["org", "users", user?.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["org", "audit-logs", user?.organizationId],
      });
    },
  });
}

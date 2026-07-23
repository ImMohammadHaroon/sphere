import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invitesApi } from "@/lib/invitesApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

export function useInvites() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["invites", user?.organizationId],
    queryFn: async () => {
      const result = await invitesApi.listInvites();
      return result.invites;
    },
    staleTime: 30_000,
    enabled:
      isAuthenticated &&
      !!user?.organizationId &&
      user.role !== "super_admin",
  });
}

export function useRevokeInvite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (id) => invitesApi.revokeInvite(id),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["invites", user?.organizationId],
          });
        },
      },
      { success: "Invite revoked." }
    )
  );
}

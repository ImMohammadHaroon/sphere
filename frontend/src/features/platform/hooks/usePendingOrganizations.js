import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveOrganization,
  listPendingOrganizations,
  rejectOrganization,
} from "@/lib/platformApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

export function usePendingOrganizations(filters) {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: ["platform", "organizations", "pending", filters],
    queryFn: () => listPendingOrganizations(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    enabled: isAuthenticated && user?.role === "super_admin",
  });
}

export function useApproveOrganization() {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: (id) => approveOrganization(id),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["platform", "organizations", "pending"],
          });
          queryClient.invalidateQueries({
            queryKey: ["platform", "organizations"],
          });
        },
      },
      { success: "Organization approved." }
    )
  );
}

export function useRejectOrganization() {
  const queryClient = useQueryClient();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, reason }) => rejectOrganization(id, reason),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["platform", "organizations", "pending"],
          });
          queryClient.invalidateQueries({
            queryKey: ["platform", "organizations"],
          });
        },
      },
      { success: "Organization rejected." }
    )
  );
}

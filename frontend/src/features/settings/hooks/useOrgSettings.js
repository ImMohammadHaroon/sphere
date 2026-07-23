import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteOrg,
  getSettings,
  updateGeneralSettings,
} from "@/lib/orgSettingsApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

const SETTINGS_KEY = ["org", "settings"];

export function useOrgSettings() {
  const { isAuthenticated, user } = useAuth();

  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async () => {
      const result = await getSettings();
      return result.organization;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && user?.role === "org_admin",
  });
}

function useInvalidateSettings() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
}

export function useUpdateGeneralSettings() {
  const invalidate = useInvalidateSettings();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: updateGeneralSettings,
        onSuccess: invalidate,
      },
      { success: "Organization settings saved." }
    )
  );
}

export function useDeleteOrg() {
  return useMutation(
    withMutationToasts(
      {
        mutationFn: deleteOrg,
      },
      { success: "Organization deleted." }
    )
  );
}

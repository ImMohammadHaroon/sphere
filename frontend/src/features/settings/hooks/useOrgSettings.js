import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deactivateOrg,
  deleteOrg,
  getSettings,
  updateGeneralSettings,
  updateInvitePolicy,
  updateSecuritySettings,
} from "@/lib/orgSettingsApi";
import { useAuth } from "@/hooks/useAuth";

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

  return useMutation({
    mutationFn: updateGeneralSettings,
    onSuccess: invalidate,
  });
}

export function useUpdateSecuritySettings() {
  const invalidate = useInvalidateSettings();

  return useMutation({
    mutationFn: updateSecuritySettings,
    onSuccess: invalidate,
  });
}

export function useUpdateInvitePolicy() {
  const invalidate = useInvalidateSettings();

  return useMutation({
    mutationFn: updateInvitePolicy,
    onSuccess: invalidate,
  });
}

export function useDeactivateOrg() {
  return useMutation({
    mutationFn: deactivateOrg,
  });
}

export function useDeleteOrg() {
  return useMutation({
    mutationFn: deleteOrg,
  });
}

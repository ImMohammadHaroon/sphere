import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateOrganization,
  deleteOrganization,
  suspendOrganization,
} from "@/lib/platformApi";

export function useOrganizationActions(id) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
    }
  }

  const suspend = useMutation({
    mutationFn: () => suspendOrganization(id),
    onSuccess: invalidate,
  });

  const activate = useMutation({
    mutationFn: () => activateOrganization(id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (confirmSlug) => deleteOrganization(id, confirmSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    },
  });

  return { suspend, activate, remove };
}

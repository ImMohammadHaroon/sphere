import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  activateOrganization,
  deleteOrganization,
  suspendOrganization,
} from "@/lib/platformApi";
import { withMutationToasts } from "@/lib/mutationToasts";

export function useOrganizationActions(id) {
  const queryClient = useQueryClient();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations", id] });
    }
  }

  const suspend = useMutation(
    withMutationToasts(
      {
        mutationFn: () => suspendOrganization(id),
        onSuccess: invalidate,
      },
      { success: "Organization suspended." }
    )
  );

  const activate = useMutation(
    withMutationToasts(
      {
        mutationFn: () => activateOrganization(id),
        onSuccess: invalidate,
      },
      { success: "Organization activated." }
    )
  );

  const remove = useMutation(
    withMutationToasts(
      {
        mutationFn: (confirmSlug) => deleteOrganization(id, confirmSlug),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
        },
      },
      { success: "Organization deleted." }
    )
  );

  return { suspend, activate, remove };
}

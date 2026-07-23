import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addMember,
  archiveProject,
  createProject,
  getProject,
  listProjects,
  removeMember,
  updateProject,
} from "@/lib/projectsApi";
import { useAuth } from "@/hooks/useAuth";
import { withMutationToasts } from "@/lib/mutationToasts";

function useOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

export function useProjects() {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["projects", user?.organizationId],
    queryFn: async () => {
      const result = await listProjects();
      return result.projects;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg,
  });
}

export function useProject(id) {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  return useQuery({
    queryKey: ["projects", user?.organizationId, id],
    queryFn: async () => {
      const result = await getProject(id);
      return result.project;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg && !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: createProject,
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId],
          });
        },
      },
      { success: "Project created." }
    )
  );
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, data }) => updateProject(id, data),
        onSuccess: (_result, { id }) => {
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId, id],
          });
        },
      },
      { success: "Project updated." }
    )
  );
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: archiveProject,
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId],
          });
        },
      },
      { success: "Project archived." }
    )
  );
}

export function useAddMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, userId }) => addMember(id, userId),
        onSuccess: (_result, { id }) => {
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId, id],
          });
        },
      },
      { success: "Member added." }
    )
  );
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation(
    withMutationToasts(
      {
        mutationFn: ({ id, userId }) => removeMember(id, userId),
        onSuccess: (_result, { id }) => {
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId],
          });
          queryClient.invalidateQueries({
            queryKey: ["projects", user?.organizationId, id],
          });
        },
      },
      { success: "Member removed." }
    )
  );
}

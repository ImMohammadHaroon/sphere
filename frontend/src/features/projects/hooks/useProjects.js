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

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId],
      });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, data }) => updateProject(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId, id],
      });
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: archiveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId],
      });
    },
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, userId }) => addMember(id, userId),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId, id],
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, userId }) => removeMember(id, userId),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["projects", user?.organizationId, id],
      });
    },
  });
}

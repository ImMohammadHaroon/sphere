import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { listProjects } from "@/lib/projectsApi";
import { listProjectTasks } from "@/lib/tasksApi";
import {
  DEFAULT_BOARD_COLUMNS,
  isTaskDone,
} from "@/lib/taskStatusConfig";
import { useAuth } from "@/hooks/useAuth";

function useOrgContext() {
  const { isAuthenticated, user } = useAuth();
  const hasOrg =
    !!user?.organizationId && user.role !== "super_admin";

  return { isAuthenticated, user, hasOrg };
}

function getProjectColumns(project) {
  return project.columns?.length ? project.columns : DEFAULT_BOARD_COLUMNS;
}

export function computeProjectStats(project, tasks = []) {
  const columns = getProjectColumns(project);
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) =>
    isTaskDone({ ...task, projectId: { columns } })
  ).length;
  const percentComplete =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  return {
    ...project,
    tasks,
    totalTasks,
    doneTasks,
    percentComplete,
  };
}

export function useClientProjects() {
  const { isAuthenticated, user, hasOrg } = useOrgContext();

  const projectsQuery = useQuery({
    queryKey: ["projects", user?.organizationId],
    queryFn: async () => {
      const result = await listProjects();
      return result.projects;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && hasOrg,
  });

  const taskQueries = useQueries({
    queries: (projectsQuery.data ?? []).map((project) => ({
      queryKey: ["tasks", user?.organizationId, project._id],
      queryFn: async () => {
        const result = await listProjectTasks(project._id);
        return result.tasks;
      },
      enabled: isAuthenticated && hasOrg && !!project._id,
      staleTime: 30_000,
    })),
  });

  const projects = useMemo(() => {
    return (projectsQuery.data ?? []).map((project, index) =>
      computeProjectStats(project, taskQueries[index]?.data ?? [])
    );
  }, [projectsQuery.data, taskQueries]);

  const averageCompletion = useMemo(() => {
    if (projects.length === 0) {
      return 0;
    }

    const sum = projects.reduce(
      (total, project) => total + project.percentComplete,
      0
    );
    return Math.round(sum / projects.length);
  }, [projects]);

  const tasksLoading = taskQueries.some((query) => query.isLoading);
  const tasksError = taskQueries.find((query) => query.isError);

  return {
    projects,
    averageCompletion,
    isLoading: projectsQuery.isLoading || tasksLoading,
    isError: projectsQuery.isError || !!tasksError,
    error: projectsQuery.error ?? tasksError?.error,
    refetch: () =>
      Promise.all([
        projectsQuery.refetch(),
        ...taskQueries.map((query) => query.refetch()),
      ]),
    isFetching: projectsQuery.isFetching || taskQueries.some((q) => q.isFetching),
  };
}

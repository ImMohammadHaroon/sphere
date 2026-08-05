import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMyTasks } from "@/features/tasks/hooks/useMyTasks";
import { listProjects } from "@/lib/projectsApi";
import { isTaskDone } from "@/lib/taskStatusConfig";
import { useAuth } from "@/hooks/useAuth";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isDone(task) {
  return isTaskDone(task);
}

export function isTaskOverdue(task) {
  if (!task.dueDate || isDone(task)) return false;
  return new Date(task.dueDate) < startOfDay(new Date());
}

export function isTaskDueSoon(task) {
  if (!task.dueDate || isDone(task)) return false;
  const due = new Date(task.dueDate);
  const today = startOfDay(new Date());
  const threeDaysOut = new Date(today.getTime() + 3 * MS_PER_DAY);
  return due >= today && due <= threeDaysOut;
}

function isOverdue(task) {
  return isTaskOverdue(task);
}

function isDueSoon(task) {
  return isTaskDueSoon(task);
}

function getProjectId(task) {
  if (task.projectId && typeof task.projectId === "object") {
    return task.projectId.id;
  }
  return task.projectId;
}

export function sortTasksByUrgency(tasks) {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a);
    const bOverdue = isOverdue(b);
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    const aDueSoon = isDueSoon(a);
    const bDueSoon = isDueSoon(b);
    if (aDueSoon !== bDueSoon) return aDueSoon ? -1 : 1;

    const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return aDue - bDue;
  });
}

export function useDashboardData() {
  const { isAuthenticated, user } = useAuth();
  const tasksQuery = useMyTasks();

  const projectsQuery = useQuery({
    queryKey: ["projects", "mine", user?.organizationId],
    queryFn: async () => {
      const result = await listProjects();
      return result.projects;
    },
    staleTime: 30_000,
    enabled: isAuthenticated && !!user?.organizationId,
  });

  const tasks = tasksQuery.data ?? [];

  const taskCounts = useMemo(() => {
    let done = 0;

    for (const task of tasks) {
      if (isTaskDone(task)) {
        done += 1;
      }
    }

    return {
      total: tasks.length,
      done,
    };
  }, [tasks]);

  const dueSoon = useMemo(
    () => tasks.filter(isDueSoon),
    [tasks]
  );

  const overdue = useMemo(
    () => tasks.filter(isOverdue),
    [tasks]
  );

  const assignedProjects = useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const countsByProject = new Map();

    for (const task of tasks) {
      const projectId = getProjectId(task);
      if (!projectId) continue;
      countsByProject.set(projectId, (countsByProject.get(projectId) ?? 0) + 1);
    }

    return projects.map((project) => ({
      ...project,
      taskCount: countsByProject.get(project._id) ?? 0,
    }));
  }, [projectsQuery.data, tasks]);

  return {
    tasks,
    taskCounts,
    dueSoon,
    overdue,
    assignedProjects,
    isLoading: tasksQuery.isLoading || projectsQuery.isLoading,
    isError: tasksQuery.isError || projectsQuery.isError,
    error: tasksQuery.error ?? projectsQuery.error,
    refetch: () => Promise.all([tasksQuery.refetch(), projectsQuery.refetch()]),
    isFetching: tasksQuery.isFetching || projectsQuery.isFetching,
  };
}

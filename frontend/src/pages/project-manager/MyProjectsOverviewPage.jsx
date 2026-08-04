import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { TaskPreviewList } from "@/components/overview/TaskPreviewList";
import { UserPreviewList } from "@/components/overview/UserPreviewList";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import {
  isTaskDueSoon,
  isTaskOverdue,
} from "@/features/dashboard/hooks/useDashboardData";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function memberCount(project) {
  if (Array.isArray(project.members)) {
    return project.members.length;
  }
  return 0;
}

function totalUniqueMembers(projects) {
  const ids = new Set();

  for (const project of projects) {
    if (project.ownerId) {
      ids.add(project.ownerId.toString());
    }
    for (const member of project.members ?? []) {
      ids.add(typeof member === "string" ? member : member.toString());
    }
  }

  return ids.size;
}

function collectUniqueMembers(projects) {
  const members = new Map();

  for (const project of projects) {
    for (const member of project.members ?? []) {
      if (typeof member === "object" && member !== null) {
        const id = member._id ?? member.id;
        if (id && !members.has(id.toString())) {
          members.set(id.toString(), member);
        }
      }
    }
  }

  return Array.from(members.values());
}

const METRIC_KEYS = {
  totalProjects: "totalProjects",
  activeProjects: "activeProjects",
  totalTasks: "totalTasks",
  teamMembers: "teamMembers",
  overdueTasks: "overdueTasks",
  dueSoonTasks: "dueSoonTasks",
};

const METRIC_TONES = {
  [METRIC_KEYS.totalProjects]: "orange",
  [METRIC_KEYS.activeProjects]: "emerald",
  [METRIC_KEYS.totalTasks]: "blue",
  [METRIC_KEYS.overdueTasks]: "rose",
  [METRIC_KEYS.dueSoonTasks]: "amber",
  [METRIC_KEYS.teamMembers]: "violet",
};

export function MyProjectsOverviewPage() {
  useDashboardPageMeta({
    title: "My projects",
    description: "Projects you manage across your organization.",
  });

  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState(null);
  const { data, isLoading, isError, error, refetch, isFetching } = useProjects();

  const taskQueries = useQueries({
    queries: (data ?? []).map((project) => ({
      queryKey: ["tasks", user?.organizationId, project._id],
      queryFn: async () => {
        const result = await listProjectTasks(project._id);
        return result.tasks;
      },
      enabled: !!user?.organizationId && !!project._id,
      staleTime: 30_000,
    })),
  });

  const taskCountByProjectId = useMemo(() => {
    const counts = new Map();
    (data ?? []).forEach((project, index) => {
      counts.set(project._id, taskQueries[index]?.data?.length ?? 0);
    });
    return counts;
  }, [data, taskQueries]);

  const allTasks = useMemo(() => {
    const tasks = [];
    (data ?? []).forEach((project, index) => {
      for (const task of taskQueries[index]?.data ?? []) {
        tasks.push({
          ...task,
          projectId: { id: project._id, name: project.name, columns: project.columns },
        });
      }
    });
    return tasks;
  }, [data, taskQueries]);

  const uniqueMembers = useMemo(
    () => collectUniqueMembers(data ?? []),
    [data]
  );

  const stats = useMemo(() => {
    const projects = data ?? [];
    return {
      total: projects.length,
      active: projects.filter((project) => project.status === "active").length,
      teamSize: totalUniqueMembers(projects),
      totalTasks: taskQueries.reduce(
        (sum, query) => sum + (query.data?.length ?? 0),
        0
      ),
    };
  }, [data, taskQueries]);

  const activeProjects = useMemo(
    () => (data ?? []).filter((project) => project.status === "active"),
    [data]
  );

  const overdueTasks = useMemo(
    () => allTasks.filter((task) => isTaskOverdue(task)),
    [allTasks]
  );

  const dueSoonTasks = useMemo(
    () => allTasks.filter((task) => isTaskDueSoon(task)),
    [allTasks]
  );

  const tasksLoading = taskQueries.some((query) => query.isLoading);

  function scrollToProjectsTable() {
    document.getElementById("projects-table")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function getDialogConfig() {
    switch (activeMetric) {
      case METRIC_KEYS.totalProjects:
        return {
          title: "Total projects",
          description: `${stats.total} project${stats.total === 1 ? "" : "s"} you manage.`,
          viewAllLabel: "View all projects",
          onViewAll: scrollToProjectsTable,
          isEmpty: (data ?? []).length === 0,
          content: (
            <ProjectPreviewList
              projects={(data ?? []).map((project) => ({
                ...project,
                taskCount: taskCountByProjectId.get(project._id) ?? 0,
              }))}
              role="project_manager"
            />
          ),
        };
      case METRIC_KEYS.activeProjects:
        return {
          title: "Active projects",
          description: `${stats.active} active project${stats.active === 1 ? "" : "s"}.`,
          viewAllLabel: "View all projects",
          onViewAll: scrollToProjectsTable,
          isEmpty: activeProjects.length === 0,
          content: (
            <ProjectPreviewList
              projects={activeProjects.map((project) => ({
                ...project,
                taskCount: taskCountByProjectId.get(project._id) ?? 0,
              }))}
              role="project_manager"
            />
          ),
        };
      case METRIC_KEYS.totalTasks:
        return {
          title: "Total tasks",
          description: `${stats.totalTasks} task${stats.totalTasks === 1 ? "" : "s"} across your projects.`,
          viewAllHref: "/dashboard/reports",
          viewAllLabel: "View reports",
          isEmpty: allTasks.length === 0,
          isLoading: tasksLoading,
          content: <TaskPreviewList tasks={allTasks} role="project_manager" />,
        };
      case METRIC_KEYS.teamMembers:
        return {
          title: "Team members",
          description: `${stats.teamSize} unique team member${stats.teamSize === 1 ? "" : "s"} across your projects.`,
          isEmpty: uniqueMembers.length === 0,
          content: (
            <UserPreviewList users={uniqueMembers} linkToDetail={false} />
          ),
        };
      case METRIC_KEYS.overdueTasks:
        return {
          title: "Overdue tasks",
          description: `${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"} across your projects.`,
          viewAllHref: "/dashboard/reports",
          viewAllLabel: "View reports",
          isEmpty: overdueTasks.length === 0,
          emptyMessage: "No overdue tasks.",
          isLoading: tasksLoading,
          content: (
            <TaskPreviewList tasks={overdueTasks} role="project_manager" />
          ),
        };
      case METRIC_KEYS.dueSoonTasks:
        return {
          title: "Due soon",
          description: `${dueSoonTasks.length} task${dueSoonTasks.length === 1 ? "" : "s"} due within 3 days.`,
          viewAllHref: "/dashboard/reports",
          viewAllLabel: "View reports",
          isEmpty: dueSoonTasks.length === 0,
          emptyMessage: "No tasks due soon.",
          isLoading: tasksLoading,
          content: (
            <TaskPreviewList tasks={dueSoonTasks} role="project_manager" />
          ),
        };
      default:
        return null;
    }
  }

  const dialogConfig = getDialogConfig();

  return (
    <>
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load projects."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">
              No projects yet  create your first one
            </p>
            <Button className="mt-4" type="button" onClick={() => setCreateOpen(true)}>
              New project
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard
                label="Total projects"
                value={stats.total}
                tone="orange"
                onClick={() => setActiveMetric(METRIC_KEYS.totalProjects)}
              />
              <MetricCard
                label="Active projects"
                value={stats.active}
                tone="emerald"
                onClick={() => setActiveMetric(METRIC_KEYS.activeProjects)}
              />
              {tasksLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <MetricCard
                    label="Total tasks"
                    value={stats.totalTasks}
                    tone="blue"
                    onClick={() => setActiveMetric(METRIC_KEYS.totalTasks)}
                  />
                  <MetricCard
                    label="Overdue tasks"
                    value={overdueTasks.length}
                    tone="rose"
                    onClick={() => setActiveMetric(METRIC_KEYS.overdueTasks)}
                  />
                  <MetricCard
                    label="Due soon"
                    value={dueSoonTasks.length}
                    tone="amber"
                    onClick={() => setActiveMetric(METRIC_KEYS.dueSoonTasks)}
                  />
                </>
              )}
              <MetricCard
                label="Team members"
                value={stats.teamSize}
                tone="violet"
                onClick={() => setActiveMetric(METRIC_KEYS.teamMembers)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                New project
              </Button>
            </div>

            <Card id="projects-table" className="overflow-hidden p-0 scroll-mt-6">
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((project) => (
                      <TableRow key={project._id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={project.status === "active" ? "success" : "muted"}
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {memberCount(project)}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {tasksLoading
                            ? "—"
                            : (taskCountByProjectId.get(project._id) ?? 0)}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(project.dueDate)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            to={`/dashboard/projects/${project._id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View detail
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </Card>
          </div>
        )
      ) : null}

      {dialogConfig ? (
        <MetricCardDetailDialog
          open={activeMetric != null}
          onOpenChange={(open) => {
            if (!open) setActiveMetric(null);
          }}
          title={dialogConfig.title}
          description={dialogConfig.description}
          viewAllHref={dialogConfig.viewAllHref}
          onViewAll={dialogConfig.onViewAll}
          viewAllLabel={dialogConfig.viewAllLabel}
          tone={METRIC_TONES[activeMetric]}
          isLoading={dialogConfig.isLoading}
          isEmpty={dialogConfig.isEmpty}
        >
          {dialogConfig.content}
        </MetricCardDetailDialog>
      ) : null}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

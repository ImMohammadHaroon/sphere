import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { listProjectTasks } from "@/lib/tasksApi";
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

export function MyProjectsOverviewPage() {
  useDashboardPageMeta({
    title: "My projects",
    description: "Projects you manage across your organization.",
  });

  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
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

  const tasksLoading = taskQueries.some((query) => query.isLoading);

  return (
    <>
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard label="Total projects" value={stats.total} />
              <MetricCard label="Active projects" value={stats.active} />
              {tasksLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <MetricCard label="Total tasks" value={stats.totalTasks} />
              )}
              <MetricCard label="Team members" value={stats.teamSize} />
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                New project
              </Button>
            </div>

            <Card className="overflow-hidden p-0">
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

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

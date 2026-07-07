import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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

export function MyProjectsOverviewPage() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error, refetch, isFetching } = useProjects();

  return (
    <ProjectManagerLayout
      title="My projects overview"
      description="Projects you manage across your organization."
    >
      <div className="mb-6 flex justify-end">
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New project
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
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
              No projects yet — create your first one
            </p>
            <Button className="mt-4" type="button" onClick={() => setCreateOpen(true)}>
              New project
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <TableScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Due date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((project) => (
                    <TableRow
                      key={project._id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                    >
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
                        {formatDate(project.dueDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
          </Card>
        )
      ) : null}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </ProjectManagerLayout>
  );
}

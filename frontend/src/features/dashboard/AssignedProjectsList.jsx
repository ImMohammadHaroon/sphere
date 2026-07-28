import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";

export function AssignedProjectsList() {
  const { assignedProjects } = useDashboardData();

  if (assignedProjects.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-text-primary">Assigned projects</h2>
        <p className="mt-2 text-sm text-text-secondary">
          You are not assigned to any projects yet.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-medium text-text-primary">Assigned projects</h2>
      </div>
      <ul className="divide-hover">
        {assignedProjects.map((project) => (
          <li key={project._id}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <Link
                to={`/member/projects/${project._id}/board`}
                className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 transition-colors hover:text-primary"
              >
                <p className="font-medium text-text-primary">{project.name}</p>
                <Badge variant={project.taskCount > 0 ? "default" : "muted"}>
                  {project.taskCount} {project.taskCount === 1 ? "task" : "tasks"}
                </Badge>
              </Link>
              <ButtonLink
                to={`/member/projects/${project._id}/board`}
                variant="primary"
                size="sm"
              >
                View board
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

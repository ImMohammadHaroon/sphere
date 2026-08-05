import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { getProjectPath } from "@/lib/projectPaths";
import { useAuth } from "@/hooks/useAuth";

const PREVIEW_LIMIT = 5;

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProjectId(project) {
  return project._id ?? project.id;
}

export function ProjectPreviewList({
  projects = [],
  limit = PREVIEW_LIMIT,
  getMeta,
  getProjectHref,
  role: roleOverride,
}) {
  const { user } = useAuth();
  const role = roleOverride ?? user?.role;
  const preview = projects.slice(0, limit);

  if (preview.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {preview.map((project) => {
        const projectId = getProjectId(project);
        const href =
          getProjectHref?.(project) ?? getProjectPath(role, projectId);
        const meta = getMeta?.(project);
        const dueDate = formatDate(project.dueDate);
        const secondaryMeta =
          meta ??
          [
            dueDate ? `Due ${dueDate}` : null,
            project.taskCount != null
              ? `${project.taskCount} ${project.taskCount === 1 ? "task" : "tasks"}`
              : null,
            project.percentComplete != null
              ? `${project.percentComplete}% complete`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");

        return (
          <li key={projectId}>
            <Link
              to={href}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {project.name}
                </p>
                {secondaryMeta ? (
                  <p className="truncate text-sm text-text-secondary">
                    {secondaryMeta}
                  </p>
                ) : null}
              </div>
              {project.status ? (
                <Badge
                  variant={project.status === "active" ? "success" : "muted"}
                >
                  {project.status}
                </Badge>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

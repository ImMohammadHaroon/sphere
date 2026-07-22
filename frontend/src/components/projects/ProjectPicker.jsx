import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";

export function ProjectPicker({
  projects = [],
  getProjectHref,
  emptyTitle = "No projects yet",
  emptyDescription,
  actionLabel = "Open",
  renderSubtitle,
}) {
  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-medium text-text-primary">{emptyTitle}</p>
        {emptyDescription ? (
          <p className="mt-2 text-sm text-text-secondary">{emptyDescription}</p>
        ) : null}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <ul className="divide-hover">
        {projects.map((project) => (
          <li key={project._id}>
            <Link
              to={getProjectHref(project)}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
            >
              <div className="min-w-0">
                <p className="font-medium text-text-primary">{project.name}</p>
                {renderSubtitle ? (
                  renderSubtitle(project)
                ) : project.description ? (
                  <p className="mt-1 line-clamp-1 text-sm text-text-secondary">
                    {project.description}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-medium text-primary">
                {actionLabel}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

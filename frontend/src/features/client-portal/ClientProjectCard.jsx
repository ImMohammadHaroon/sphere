import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ClientProgressBar } from "@/features/client-portal/ClientProgressBar";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getOwnerName(project) {
  const ownerId = project.ownerId?.toString?.() ?? project.ownerId;
  if (!ownerId) return null;

  for (const member of project.members ?? []) {
    if (typeof member !== "object" || !member) continue;

    const memberId = member.id ?? member._id?.toString?.();
    if (memberId === ownerId) {
      return member.name ?? null;
    }
  }

  return null;
}

export function ClientProjectCard({ project }) {
  const ownerName = getOwnerName(project);
  const dueDate = formatDate(project.dueDate);

  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="space-y-1">
        <h2 className="font-medium text-text-primary">{project.name}</h2>
        {project.description ? (
          <p className="line-clamp-2 text-sm text-text-secondary">
            {project.description}
          </p>
        ) : null}
        {ownerName ? (
          <p className="text-sm text-text-secondary">Owner: {ownerName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <ClientProgressBar value={project.percentComplete} />
        <p className="text-sm text-text-secondary">
          {project.doneTasks} of {project.totalTasks} tasks complete{" "}
          {project.percentComplete}%
        </p>
      </div>

      {dueDate ? (
        <p className="text-sm text-text-secondary">Due {dueDate}</p>
      ) : null}

      <div className="mt-auto pt-2">
        <Link
          to={`/portal/progress?project=${project._id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          View progress
        </Link>
      </div>
    </Card>
  );
}

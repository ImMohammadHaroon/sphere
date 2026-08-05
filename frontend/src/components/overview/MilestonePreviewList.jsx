import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { getMilestoneDetailPath } from "@/lib/projectPaths";

const PREVIEW_LIMIT = 5;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MilestonePreviewList({
  milestones = [],
  limit = PREVIEW_LIMIT,
  projectId,
  role = "client",
}) {
  const preview = milestones.slice(0, limit);

  if (preview.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {preview.map((milestone) => {
        const milestoneId = milestone._id ?? milestone.id;
        const href = projectId
          ? getMilestoneDetailPath(role, projectId, milestoneId)
          : "/portal/milestones";

        return (
          <li key={milestoneId}>
            <Link
              to={href}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {milestone.name}
                </p>
                <p className="text-sm text-text-secondary">
                  Due {formatDate(milestone.dueDate)}
                </p>
              </div>
              <Badge variant={milestoneStatusBadgeVariant(milestone.status)}>
                {formatMilestoneStatus(milestone.status)}
              </Badge>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

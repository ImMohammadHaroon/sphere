import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ClientProgressBar } from "@/features/client-portal/ClientProgressBar";
import {
  formatProjectProgress,
  formatTaskSummary,
} from "@/features/client-portal/clientCopy";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getContactName(project) {
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
  const contactName = getContactName(project);
  const dueDate = formatDate(project.dueDate);
  const progressLabel = formatProjectProgress(project.percentComplete);
  const taskSummary = formatTaskSummary(
    project.doneTasks,
    project.totalTasks,
    project.percentComplete
  );

  return (
    <Card className="flex h-full flex-col gap-5 p-5">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-text-primary">{project.name}</h2>
        {project.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {project.description}
          </p>
        ) : null}
        {contactName ? (
          <p className="text-sm text-text-muted">Your contact: {contactName}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-text-primary">{progressLabel}</span>
          <span className="text-text-secondary">{taskSummary}</span>
        </div>
        <ClientProgressBar value={project.percentComplete} />
      </div>

      {dueDate ? (
        <p className="text-sm text-text-secondary">Expected by {dueDate}</p>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row">
        <Link
          to={`/portal/progress?project=${project._id}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          View progress
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          to="/portal/milestones"
          className="inline-flex flex-1 items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-surface-raised"
        >
          Reviews
        </Link>
      </div>
    </Card>
  );
}

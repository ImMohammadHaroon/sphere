import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { MilestoneFormDialog } from "@/features/milestones/components/MilestoneFormDialog";
import { MilestoneFeedbackThread } from "@/features/milestones/components/MilestoneFeedbackThread";
import { MilestoneRejectReason } from "@/features/milestones/components/MilestoneRejectReason";
import {
  useCreateMilestone,
  useProjectMilestones,
} from "@/features/milestones/hooks/useMilestones";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { getMilestoneDetailPath } from "@/lib/projectPaths";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function formatDueDate(value) {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

function sortByDueDate(milestones) {
  return [...(milestones ?? [])].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return aTime - bTime;
  });
}

export function ProjectMilestonesTab({
  projectId,
  role,
  canManage = false,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjectMilestones(projectId);
  const createMilestone = useCreateMilestone(projectId);

  const milestones = useMemo(() => sortByDueDate(data), [data]);

  async function handleCreate(formData) {
    const result = await createMilestone.mutateAsync(formData);
    return result.milestone;
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load milestones."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      {canManage ? (
        <div className="mb-4 flex justify-end">
          <Button type="button" onClick={() => setFormOpen(true)}>
            New milestone
          </Button>
        </div>
      ) : null}

      {milestones.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">No milestones yet for this project.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-hover">
            {milestones.map((milestone) => {
              const canReplyToFeedback =
                milestone.status === "pending" &&
                (role === "org_admin" ||
                  role === "project_manager" ||
                  role === "team_member");

              return (
              <li key={milestone._id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={getMilestoneDetailPath(role, projectId, milestone._id)}
                        className="font-medium text-text-primary hover:text-primary"
                      >
                        {milestone.name}
                      </Link>
                      <Badge variant={milestoneStatusBadgeVariant(milestone.status)}>
                        {formatMilestoneStatus(milestone.status)}
                      </Badge>
                    </div>
                    {milestone.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                        {milestone.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-text-muted">
                      Due {formatDueDate(milestone.dueDate)}
                    </p>
                    <MilestoneRejectReason
                      reason={milestone.rejectReason}
                      className="mt-3"
                    />
                    <MilestoneFeedbackThread
                      milestoneId={milestone._id}
                      messages={milestone.feedbackMessages ?? []}
                      clientFeedback={milestone.clientFeedback}
                      canReply={canReplyToFeedback}
                      compact
                      className="mt-3"
                    />
                  </div>

                  <ButtonLink
                    to={getMilestoneDetailPath(role, projectId, milestone._id)}
                    variant="outline"
                    size="sm"
                  >
                    View details
                  </ButtonLink>
                </div>
              </li>
            );
            })}
          </ul>
        </Card>
      )}

      <MilestoneFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        milestone={null}
        onSubmit={handleCreate}
        isLoading={createMilestone.isPending}
      />
    </>
  );
}

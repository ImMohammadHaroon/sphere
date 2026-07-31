import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MilestoneFeedbackThread } from "@/features/milestones/components/MilestoneFeedbackThread";
import { MilestoneFeedbackDialog } from "@/features/milestones/components/MilestoneFeedbackDialog";
import { MilestoneRejectDialog } from "@/features/milestones/components/MilestoneRejectDialog";
import { MilestoneRejectReason } from "@/features/milestones/components/MilestoneRejectReason";
import { formatClientMilestoneStatus } from "@/features/client-portal/clientCopy";
import { milestoneStatusBadgeVariant } from "@/features/milestones/milestoneStatus";
import {
  useApproveMilestone,
  useSubmitMilestoneFeedback,
} from "@/features/milestones/hooks/useMilestones";
import { MilestoneAttachments } from "@/features/milestones/components/MilestoneAttachments";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { listMilestones } from "@/lib/milestonesApi";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";

function formatDueDate(value) {
  if (!value) return "—";
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy");
}

function sortByDueDate(milestones) {
  return [...milestones].sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    return aTime - bTime;
  });
}

export function ClientMilestonesPage() {
  useDashboardPageMeta({
    title: "Reviews",
    description:
      "Your team will send deliverables here. Take a look and let them know if everything looks good.",
  });

  const { user } = useAuth();
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErr,
    refetch: refetchProjects,
    isFetching: projectsFetching,
  } = useProjects();

  const milestoneQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["milestones", user?.organizationId, project._id],
      queryFn: async () => {
        const result = await listMilestones(project._id);
        return result.milestones;
      },
      enabled: !!user?.organizationId && !!project._id,
      staleTime: 30_000,
    })),
  });

  const approveMilestone = useApproveMilestone();
  const submitFeedback = useSubmitMilestoneFeedback();
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const grouped = useMemo(() => {
    return projects
      .map((project, index) => ({
        project,
        milestones: sortByDueDate(milestoneQueries[index]?.data ?? []),
      }))
      .filter((group) => group.milestones.length > 0);
  }, [projects, milestoneQueries]);

  const flatMilestones = useMemo(() => {
    return projects.flatMap((project, index) =>
      (milestoneQueries[index]?.data ?? []).map((milestone) => ({
        ...milestone,
        projectName: project.name,
        projectId: project._id,
      }))
    );
  }, [projects, milestoneQueries]);

  const milestonesLoading = milestoneQueries.some((query) => query.isLoading);
  const milestonesError = milestoneQueries.find((query) => query.isError);
  const isLoading = projectsLoading || (!!projects.length && milestonesLoading);
  const isError = projectsError || !!milestonesError;
  const error = projectsErr ?? milestonesError?.error;
  const isFetching =
    projectsFetching || milestoneQueries.some((query) => query.isFetching);

  async function handleApproveConfirm() {
    if (!approveTarget) return;
    await approveMilestone.mutateAsync({
      id: approveTarget._id,
      decision: "approved",
    });
    setApproveTarget(null);
  }

  async function handleRejectConfirm(rejectReason) {
    if (!rejectTarget) return;
    await approveMilestone.mutateAsync({
      id: rejectTarget._id,
      decision: "rejected",
      rejectReason,
    });
    setRejectTarget(null);
  }

  async function handleFeedbackSubmit(feedback) {
    if (!feedbackTarget) return;
    await submitFeedback.mutateAsync({
      id: feedbackTarget._id,
      feedback,
    });
    setFeedbackTarget(null);
  }

  function refetchAll() {
    return Promise.all([
      refetchProjects(),
      ...milestoneQueries.map((query) => query.refetch()),
    ]);
  }

  return (
    <>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            We could not load your reviews. Please try again.
          </p>
          <Button
            className="mt-4"
            onClick={() => refetchAll()}
            isLoading={isFetching}
          >
            Try again
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        flatMilestones.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-lg font-medium text-text-primary">
              Nothing to review yet
            </p>
            <p className="mt-2 text-text-secondary">
              When your team sends something for approval, it will appear here.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map(({ project, milestones }) => (
              <Card key={project._id} className="overflow-hidden p-0">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="font-medium text-text-primary">
                    {project.name}
                  </h2>
                </div>
                <ul className="divide-hover">
                  {milestones.map((milestone) => {
                    const isPending = milestone.status === "pending";

                    return (
                      <li
                        key={milestone._id}
                        className="flex flex-wrap items-start justify-between gap-3 px-4 py-4"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-text-primary">
                              {milestone.name}
                            </h3>
                            <Badge
                              variant={milestoneStatusBadgeVariant(
                                milestone.status
                              )}
                            >
                              {formatClientMilestoneStatus(milestone.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-text-muted">
                            Expected by {formatDueDate(milestone.dueDate)}
                          </p>
                          {milestone.description ? (
                            <p className="mt-1 text-sm text-text-secondary">
                              {milestone.description}
                            </p>
                          ) : null}
                          <MilestoneAttachments
                            milestoneId={milestone._id}
                            canUpload={false}
                            compact
                          />
                          <MilestoneRejectReason
                            reason={milestone.rejectReason}
                            className="mt-3"
                          />
                          <MilestoneFeedbackThread
                            milestoneId={milestone._id}
                            messages={milestone.feedbackMessages ?? []}
                            clientFeedback={milestone.clientFeedback}
                            compact
                            className="mt-3"
                          />
                        </div>

                        {isPending ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setFeedbackTarget(milestone)}
                            >
                              Ask a question
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setApproveTarget(milestone)}
                            >
                              Looks good
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setRejectTarget(milestone)}
                            >
                              Needs changes
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ))}
          </div>
        )
      ) : null}

      <ConfirmDialog
        open={Boolean(approveTarget)}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this deliverable?"
        description={`Let your team know that "${approveTarget?.name}" looks good to you.`}
        confirmLabel="Yes, looks good"
        onConfirm={handleApproveConfirm}
        isLoading={approveMilestone.isPending}
      />

      <MilestoneRejectDialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        milestone={rejectTarget}
        onConfirm={handleRejectConfirm}
        isLoading={approveMilestone.isPending}
      />

      <MilestoneFeedbackDialog
        open={Boolean(feedbackTarget)}
        onOpenChange={(open) => !open && setFeedbackTarget(null)}
        milestone={feedbackTarget}
        onSubmit={handleFeedbackSubmit}
        isLoading={submitFeedback.isPending}
      />
    </>
  );
}

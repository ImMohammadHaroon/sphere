import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { useApproveMilestone } from "@/features/milestones/hooks/useMilestones";
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
  const [decisionTarget, setDecisionTarget] = useState(null);

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

  async function handleDecisionConfirm() {
    if (!decisionTarget) return;
    await approveMilestone.mutateAsync({
      id: decisionTarget.milestone._id,
      decision: decisionTarget.decision,
    });
    setDecisionTarget(null);
  }

  function refetchAll() {
    return Promise.all([
      refetchProjects(),
      ...milestoneQueries.map((query) => query.refetch()),
    ]);
  }

  return (
    <ClientPortalLayout
      title="Milestones"
      description="Review deliverables and approve completed milestones."
    >
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
            {error instanceof Error
              ? error.message
              : "Failed to load milestones."}
          </p>
          <Button
            className="mt-4"
            onClick={() => refetchAll()}
            isLoading={isFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError ? (
        flatMilestones.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No milestones to review yet</p>
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
                <ul className="divide-y divide-border">
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
                              {formatMilestoneStatus(milestone.status)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {project.name}
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            Due {formatDueDate(milestone.dueDate)}
                          </p>
                        </div>

                        {isPending ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() =>
                                setDecisionTarget({
                                  milestone,
                                  decision: "approved",
                                })
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                setDecisionTarget({
                                  milestone,
                                  decision: "rejected",
                                })
                              }
                            >
                              Reject
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
        open={Boolean(decisionTarget)}
        onOpenChange={(open) => !open && setDecisionTarget(null)}
        title={
          decisionTarget?.decision === "rejected"
            ? "Reject milestone"
            : "Approve milestone"
        }
        description={
          decisionTarget?.decision === "rejected"
            ? "Reject this milestone?"
            : "Approve this milestone?"
        }
        confirmLabel={
          decisionTarget?.decision === "rejected" ? "Reject" : "Approve"
        }
        variant={
          decisionTarget?.decision === "rejected" ? "danger" : "primary"
        }
        onConfirm={handleDecisionConfirm}
        isLoading={approveMilestone.isPending}
      />
    </ClientPortalLayout>
  );
}

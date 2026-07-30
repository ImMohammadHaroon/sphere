import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MilestoneAttachments } from "@/features/milestones/components/MilestoneAttachments";
import { MilestoneFeedbackThread } from "@/features/milestones/components/MilestoneFeedbackThread";
import { MilestoneRejectReason } from "@/features/milestones/components/MilestoneRejectReason";
import { MilestoneFormDialog } from "@/features/milestones/components/MilestoneFormDialog";
import {
  useDeleteMilestone,
  useProjectMilestones,
  useUpdateMilestone,
} from "@/features/milestones/hooks/useMilestones";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { useProject } from "@/features/projects/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { getProjectPath } from "@/lib/projectPaths";
import { Alert } from "@/components/ui/Alert";
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

export function MilestoneDetailPage() {
  const navigate = useNavigate();
  const { id, projectId: routeProjectId, milestoneId = "" } = useParams();
  const projectId = routeProjectId || id || "";
  const { user } = useAuth();
  const role = user?.role ?? "project_manager";
  const canManage = role === "org_admin" || role === "project_manager";

  const { data: project } = useProject(projectId);
  const {
    data: milestones,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjectMilestones(projectId);

  const milestone = useMemo(
    () => (milestones ?? []).find((item) => item._id === milestoneId),
    [milestones, milestoneId]
  );

  const updateMilestone = useUpdateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const projectPath = getProjectPath(role, projectId);
  const canEdit = canManage && milestone?.status === "pending";
  const canReplyToFeedback =
    milestone?.status === "pending" &&
    (role === "org_admin" ||
      role === "project_manager" ||
      role === "team_member");

  useDashboardPageMeta({
    title: milestone?.name ?? "Milestone",
    description: project?.name
      ? `Milestone in ${project.name}`
      : "Milestone details and deliverables.",
    showBack: true,
    backLabel: "Back to project",
    backTo: `${projectPath}?tab=milestones`,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load milestone."}
        </p>
        <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
          Retry
        </Button>
      </Card>
    );
  }

  if (!milestone) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-medium text-text-primary">Milestone not found</p>
        <p className="mt-2 text-sm text-text-secondary">
          This milestone may have been deleted or the link is incorrect.
        </p>
      </Card>
    );
  }

  async function handleUpdate(formData) {
    await updateMilestone.mutateAsync({ id: milestone._id, data: formData });
    return null;
  }

  async function handleDelete() {
    await deleteMilestone.mutateAsync(milestone._id);
    setDeleteOpen(false);
    navigate(`${projectPath}?tab=milestones`);
  }

  return (
    <>
      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-text-primary">
                {milestone.name}
              </h2>
              <Badge variant={milestoneStatusBadgeVariant(milestone.status)}>
                {formatMilestoneStatus(milestone.status)}
              </Badge>
            </div>

            {milestone.description ? (
              <p className="max-w-3xl whitespace-pre-wrap text-text-secondary">
                {milestone.description}
              </p>
            ) : (
              <p className="text-sm text-text-muted">No description provided.</p>
            )}

            <p className="text-sm text-text-secondary">
              Due {formatDueDate(milestone.dueDate)}
            </p>
          </div>

          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(true)}>
                Edit
              </Button>
              <Button type="button" variant="danger" onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {(milestone.feedbackMessages?.length ||
        milestone.clientFeedback?.trim() ||
        milestone.rejectReason?.trim()) ? (
        <Card className="p-6">
          <MilestoneRejectReason
            reason={milestone.rejectReason}
            className="mb-4"
          />
          {(milestone.feedbackMessages?.length ||
            milestone.clientFeedback?.trim()) ? (
            <MilestoneFeedbackThread
              milestoneId={milestone._id}
              messages={milestone.feedbackMessages ?? []}
              clientFeedback={milestone.clientFeedback}
              canReply={canReplyToFeedback}
            />
          ) : null}
        </Card>
      ) : null}

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-text-primary">Deliverables</h3>
        <MilestoneAttachments
          milestoneId={milestone._id}
          canUpload={canEdit}
        />
      </Card>

      {!canEdit && milestone.status !== "pending" ? (
        <Alert className="mt-4" variant="info">
          This milestone has been {milestone.status} and can no longer be edited.
        </Alert>
      ) : null}

      <MilestoneFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        milestone={milestone}
        onSubmit={handleUpdate}
        isLoading={updateMilestone.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete milestone"
        description="Delete this milestone? This can't be undone."
        confirmLabel="Delete milestone"
        onConfirm={handleDelete}
        isLoading={deleteMilestone.isPending}
      />
    </>
  );
}

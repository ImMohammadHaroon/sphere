import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { MilestoneFormDialog } from "@/features/milestones/components/MilestoneFormDialog";
import { MilestoneAttachments } from "@/features/milestones/components/MilestoneAttachments";
import {
  useCreateMilestone,
  useDeleteMilestone,
  useProjectMilestones,
  useUpdateMilestone,
} from "@/features/milestones/hooks/useMilestones";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

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

export function MilestonesPage() {
  const navigate = useNavigate();
  const { id, projectId: routeProjectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId =
    routeProjectId || id || searchParams.get("projectId") || "";
  const highlight = searchParams.get("highlight") || "";

  useDashboardPageMeta({
    title: "Milestones",
    description: "Track key deliverables and project phases.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/dashboard/milestones" : undefined,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeHighlight, setActiveHighlight] = useState(null);
  const highlightHandled = useRef(false);

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjectMilestones(projectId);

  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);

  const milestones = useMemo(() => sortByDueDate(data), [data]);

  useEffect(() => {
    highlightHandled.current = false;
  }, [highlight, projectId]);

  useEffect(() => {
    if (!highlight || !projectId || isLoading || highlightHandled.current) {
      return;
    }

    const exists = (data ?? []).some((m) => m._id === highlight);
    if (!exists) {
      return;
    }

    highlightHandled.current = true;
    setActiveHighlight(highlight);

    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(`milestone-${highlight}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    const clearTimer = window.setTimeout(() => {
      setActiveHighlight(null);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("highlight");
          return next;
        },
        { replace: true }
      );
    }, 3500);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clearTimer);
    };
  }, [highlight, projectId, isLoading, data, setSearchParams]);

  function handleProjectChange(nextId) {
    if (!nextId) {
      navigate("/dashboard/milestones");
      return;
    }
    const qs = highlight ? `?highlight=${encodeURIComponent(highlight)}` : "";
    navigate(`/dashboard/projects/${nextId}/milestones${qs}`);
  }

  async function handleFormSubmit(formData) {
    if (editing) {
      await updateMilestone.mutateAsync({ id: editing._id, data: formData });
      return null;
    }

    const result = await createMilestone.mutateAsync(formData);
    return result.milestone;
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteMilestone.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  }

  return (
    <>
      {projectId ? (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New milestone
          </Button>
        </div>
      ) : null}

      {projectsLoading && !projectId ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : null}

      {!projectsLoading && !projectId ? (
        <ProjectPicker
          projects={projects ?? []}
          getProjectHref={(project) =>
            `/dashboard/projects/${project._id}/milestones`
          }
          actionLabel="Manage"
          emptyTitle="No projects yet"
          emptyDescription="Create a project to manage its milestones."
        />
      ) : null}

      {projectId && isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : null}

      {projectId && isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error
              ? error.message
              : "Failed to load milestones."}
          </p>
          <Button
            className="mt-4"
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {projectId && !isLoading && !isError ? (
        milestones.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">
              No milestones yet for this project
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y divide-border">
              {milestones.map((milestone) => {
                const canEdit = milestone.status === "pending";

                return (
                  <li
                    key={milestone._id}
                    id={`milestone-${milestone._id}`}
                    className={cn(
                      "px-4 py-4 transition-shadow",
                      activeHighlight === milestone._id &&
                        "ring-2 ring-inset ring-primary"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
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
                        {milestone.description ? (
                          <p className="mt-1 text-sm text-text-secondary">
                            {milestone.description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-sm text-text-muted">
                          Due {formatDueDate(milestone.dueDate)}
                        </p>
                        <MilestoneAttachments
                          milestoneId={milestone._id}
                          canUpload={canEdit}
                          compact
                        />
                      </div>

                      {canEdit ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(milestone);
                              setFormOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(milestone)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )
      ) : null}

      <MilestoneFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        milestone={editing}
        onSubmit={handleFormSubmit}
        isLoading={createMilestone.isPending || updateMilestone.isPending}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete milestone"
        description="Delete this milestone? This can't be undone."
        confirmLabel="Delete milestone"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMilestone.isPending}
      />
    </>
  );
}

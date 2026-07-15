import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ProjectManagerLayout } from "@/components/layout/ProjectManagerLayout";
import { MilestoneFormDialog } from "@/features/milestones/components/MilestoneFormDialog";
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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
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
      setEditing(null);
      return;
    }
    await createMilestone.mutateAsync(formData);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteMilestone.mutateAsync(deleteTarget._id);
    setDeleteTarget(null);
  }

  return (
    <ProjectManagerLayout
      title="Milestones"
      description="Track key deliverables and project phases."
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {projectId ? (
            <ButtonLink
              to={`/dashboard/projects/${projectId}`}
              variant="ghost"
              size="sm"
            >
              ← Back to project
            </ButtonLink>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="shrink-0">Project</span>
            <select
              value={projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={projectsLoading}
              className="h-10 min-w-[12rem] rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="">
                {projectsLoading ? "Loading…" : "Select a project"}
              </option>
              {(projects ?? []).map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {projectId ? (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            New milestone
          </Button>
        ) : null}
      </div>

      {!projectId ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">
            Select a project to manage its milestones.
          </p>
        </Card>
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
    </ProjectManagerLayout>
  );
}

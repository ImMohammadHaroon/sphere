import { Link, useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { BurndownChart } from "@/features/reports/BurndownChart";
import { useBurndownReport } from "@/features/reports/hooks/useProjectReports";
import { useProjectMilestones } from "@/features/milestones/hooks/useMilestones";
import {
  formatMilestoneStatus,
  milestoneStatusBadgeVariant,
} from "@/features/milestones/milestoneStatus";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { ProjectPicker } from "@/components/projects/ProjectPicker";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = typeof value === "string" ? parseISO(value) : new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return format(date, "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function ReportsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}

function getRemainingWork(series) {
  if (!Array.isArray(series) || series.length === 0) return null;
  const last = series[series.length - 1];
  return typeof last?.actual === "number" ? last.actual : null;
}

function MilestoneProgressCard({ milestones, isLoading }) {
  const pending = milestones.filter((m) => m.status === "pending");
  const approved = milestones.filter((m) => m.status === "approved");
  const rejected = milestones.filter((m) => m.status === "rejected");
  const upcoming = [...milestones]
    .sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 5);

  return (
    <Card className="flex h-full min-h-72 flex-col overflow-hidden p-0">
      <div className="border-b border-border px-4 py-4 sm:px-6">
        <h2 className="font-display text-lg font-semibold">Milestone delivery</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Approval status for this project&apos;s deliverables.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-4 sm:p-6">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <p className="text-sm text-text-secondary">
            No milestones on this project yet.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Pending
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-text-primary">
                {pending.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Approved
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-primary">
                {approved.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                Rejected
              </p>
              <p className="mt-1 font-display text-xl font-semibold text-danger">
                {rejected.length}
              </p>
            </div>
          </div>

          <ul className="divide-hover flex-1">
            {upcoming.map((milestone) => (
              <li
                key={milestone._id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-primary">
                    {milestone.name}
                  </p>
                  <p className="mt-0.5 text-sm text-text-secondary">
                    Due {formatDate(milestone.dueDate)}
                  </p>
                </div>
                <Badge variant={milestoneStatusBadgeVariant(milestone.status)}>
                  {formatMilestoneStatus(milestone.status)}
                </Badge>
              </li>
            ))}
          </ul>

          {pending.length > 0 ? (
            <div className="border-t border-border px-4 py-3 sm:px-6">
              <Link
                to="/portal/milestones"
                className="text-sm font-medium text-primary hover:underline"
              >
                Review pending milestones →
              </Link>
            </div>
          ) : null}
        </>
      )}
    </Card>
  );
}

export function ClientReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("project") || "";

  useDashboardPageMeta({
    title: "Reports",
    description:
      "Track delivery progress and milestone status for shared projects.",
    showBack: Boolean(projectId),
    backLabel: projectId ? "All projects" : undefined,
    backTo: projectId ? "/portal/reports" : undefined,
  });

  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError: projectsError,
    error: projectsErr,
    refetch: refetchProjects,
    isFetching: projectsFetching,
  } = useProjects();

  const burndown = useBurndownReport(projectId);
  const milestones = useProjectMilestones(projectId);

  const selectedProject = projects.find((project) => project._id === projectId);
  const remaining = getRemainingWork(burndown.data?.series);
  const totalScope = burndown.data?.totalScope ?? 0;
  const completed =
    remaining == null ? null : Math.max(0, totalScope - remaining);
  const milestoneList = milestones.data ?? [];
  const pendingMilestones = milestoneList.filter((m) => m.status === "pending")
    .length;

  function handleProjectChange(nextId) {
    if (!nextId) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ project: nextId }, { replace: true });
  }

  const reportLoading =
    !!projectId &&
    !!selectedProject &&
    (burndown.isLoading || milestones.isLoading);

  const reportError =
    !!projectId &&
    !!selectedProject &&
    (burndown.isError || milestones.isError);

  return (
    <>
      {projectsLoading && !projectId ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : null}

      {projectsError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {projectsErr instanceof Error
              ? projectsErr.message
              : "Failed to load projects."}
          </p>
          <Button
            className="mt-4"
            onClick={() => refetchProjects()}
            isLoading={projectsFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {!projectsLoading && !projectsError && !projectId ? (
        <ProjectPicker
          projects={projects}
          getProjectHref={(project) => `/portal/reports?project=${project._id}`}
          actionLabel="Open report"
          emptyTitle="No shared projects yet"
          emptyDescription="When a project is shared with you, burndown and milestone progress will appear here."
        />
      ) : null}

      {projectId && !selectedProject && !projectsLoading ? (
        <Card className="p-8 text-center">
          <p className="text-text-secondary">This project is not available.</p>
          <button
            type="button"
            className="mt-4 text-sm font-medium text-primary hover:underline"
            onClick={() => handleProjectChange("")}
          >
            Back to all projects
          </button>
        </Card>
      ) : null}

      {projectId && selectedProject && reportLoading ? <ReportsSkeleton /> : null}

      {projectId && selectedProject && reportError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {burndown.error instanceof Error
              ? burndown.error.message
              : milestones.error instanceof Error
                ? milestones.error.message
                : "Failed to load report."}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              burndown.refetch();
              milestones.refetch();
            }}
            isLoading={burndown.isFetching || milestones.isFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {projectId && selectedProject && !reportLoading && !reportError ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total tasks" value={totalScope} />
            <MetricCard
              label="Completed"
              value={completed ?? 0}
            />
            <MetricCard
              label="Awaiting your review"
              value={pendingMilestones}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <BurndownChart
              series={burndown.data?.series}
              totalScope={burndown.data?.totalScope}
              title={`${selectedProject.name} burndown`}
              description="Remaining work versus the ideal path from project start to due date."
            />
            <MilestoneProgressCard
              milestones={milestoneList}
              isLoading={false}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

import { useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { MilestonePreviewList } from "@/components/overview/MilestonePreviewList";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { Skeleton } from "@/components/ui/Skeleton";

const METRIC_KEYS = {
  activeProjects: "activeProjects",
  averageCompletion: "averageCompletion",
  pendingReviews: "pendingReviews",
  totalTasks: "totalTasks",
};

const METRIC_TONES = {
  [METRIC_KEYS.activeProjects]: "emerald",
  [METRIC_KEYS.averageCompletion]: "blue",
  [METRIC_KEYS.pendingReviews]: "rose",
  [METRIC_KEYS.totalTasks]: "amber",
};

export function ClientSummaryCards({
  activeProjectCount,
  averageCompletion,
  isLoading,
  projects = [],
  pendingCount = 0,
  pendingMilestones = [],
}) {
  const [activeMetric, setActiveMetric] = useState(null);

  const activeProjects = useMemo(
    () => projects.filter((project) => project.status === "active"),
    [projects]
  );

  const totalTasks = useMemo(
    () => projects.reduce((sum, project) => sum + (project.totalTasks ?? 0), 0),
    [projects]
  );

  function getDialogConfig() {
    switch (activeMetric) {
      case METRIC_KEYS.activeProjects:
        return {
          title: "Active projects",
          description: `${activeProjectCount} active project${activeProjectCount === 1 ? "" : "s"} shared with you.`,
          viewAllHref: "/portal",
          viewAllLabel: "View all projects",
          isEmpty: activeProjects.length === 0,
          content: (
            <ProjectPreviewList
              projects={activeProjects}
              role="client"
              getMeta={(project) => `${project.percentComplete ?? 0}% complete`}
            />
          ),
        };
      case METRIC_KEYS.averageCompletion:
        return {
          title: "Average completion",
          description: `${averageCompletion}% average completion across your projects.`,
          viewAllHref: "/portal/reports",
          viewAllLabel: "View reports",
          isEmpty: projects.length === 0,
          content: (
            <ProjectPreviewList
              projects={projects}
              role="client"
              getMeta={(project) => `${project.percentComplete ?? 0}% complete`}
            />
          ),
        };
      case METRIC_KEYS.pendingReviews:
        return {
          title: "Pending reviews",
          description: `${pendingCount} milestone${pendingCount === 1 ? "" : "s"} waiting for your review.`,
          viewAllHref: "/portal/milestones",
          viewAllLabel: "View all milestones",
          isEmpty: pendingCount === 0,
          emptyMessage: "No milestones waiting for your review.",
          content: (
            <MilestonePreviewList
              milestones={pendingMilestones}
              role="client"
            />
          ),
        };
      case METRIC_KEYS.totalTasks:
        return {
          title: "Total tasks",
          description: `${totalTasks} task${totalTasks === 1 ? "" : "s"} across your projects.`,
          viewAllHref: "/portal/reports",
          viewAllLabel: "View reports",
          isEmpty: totalTasks === 0,
          content: (
            <ProjectPreviewList
              projects={projects}
              role="client"
              getMeta={(project) =>
                `${project.doneTasks ?? 0} of ${project.totalTasks ?? 0} done`
              }
            />
          ),
        };
      default:
        return null;
    }
  }

  const dialogConfig = getDialogConfig();

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active projects"
          value={activeProjectCount}
          tone="emerald"
          onClick={() => setActiveMetric(METRIC_KEYS.activeProjects)}
        />
        <MetricCard
          label="Average completion"
          value={`${averageCompletion}%`}
          tone="blue"
          onClick={() => setActiveMetric(METRIC_KEYS.averageCompletion)}
        />
        <MetricCard
          label="Pending reviews"
          value={pendingCount}
          tone="rose"
          onClick={() => setActiveMetric(METRIC_KEYS.pendingReviews)}
        />
        <MetricCard
          label="Total tasks"
          value={totalTasks}
          tone="amber"
          onClick={() => setActiveMetric(METRIC_KEYS.totalTasks)}
        />
      </div>

      {dialogConfig ? (
        <MetricCardDetailDialog
          open={activeMetric != null}
          onOpenChange={(open) => {
            if (!open) setActiveMetric(null);
          }}
          title={dialogConfig.title}
          description={dialogConfig.description}
          viewAllHref={dialogConfig.viewAllHref}
          viewAllLabel={dialogConfig.viewAllLabel}
          tone={METRIC_TONES[activeMetric]}
          isEmpty={dialogConfig.isEmpty}
          emptyMessage={dialogConfig.emptyMessage}
        >
          {dialogConfig.content}
        </MetricCardDetailDialog>
      ) : null}
    </>
  );
}

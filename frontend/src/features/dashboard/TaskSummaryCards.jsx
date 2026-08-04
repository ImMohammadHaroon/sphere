import { useMemo, useState } from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import { MetricCardDetailDialog } from "@/components/overview/MetricCardDetailDialog";
import { ProjectPreviewList } from "@/components/overview/ProjectPreviewList";
import { TaskPreviewList } from "@/components/overview/TaskPreviewList";
import {
  isTaskOverdue,
  sortTasksByUrgency,
  useDashboardData,
} from "@/features/dashboard/hooks/useDashboardData";
import { isTaskDone } from "@/lib/taskStatusConfig";

const METRIC_KEYS = {
  total: "total",
  dueSoon: "dueSoon",
  overdue: "overdue",
  completed: "completed",
  assignedProjects: "assignedProjects",
  inProgress: "inProgress",
};

const METRIC_TONES = {
  [METRIC_KEYS.total]: "emerald",
  [METRIC_KEYS.dueSoon]: "blue",
  [METRIC_KEYS.overdue]: "rose",
  [METRIC_KEYS.completed]: "teal",
  [METRIC_KEYS.assignedProjects]: "violet",
  [METRIC_KEYS.inProgress]: "amber",
};

export function TaskSummaryCards() {
  const { taskCounts, dueSoon, overdue, tasks, assignedProjects } =
    useDashboardData();
  const [activeMetric, setActiveMetric] = useState(null);

  const completedTasks = useMemo(
    () => tasks.filter((task) => isTaskDone(task)),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () =>
      tasks.filter((task) => !isTaskDone(task) && !isTaskOverdue(task)),
    [tasks]
  );

  const projectsWithTasks = useMemo(
    () => assignedProjects.filter((project) => project.taskCount > 0),
    [assignedProjects]
  );

  const sortedTasks = useMemo(() => sortTasksByUrgency(tasks), [tasks]);

  function scrollToAssignedProjects() {
    document.getElementById("assigned-projects")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function getDialogConfig() {
    switch (activeMetric) {
      case METRIC_KEYS.total:
        return {
          title: "Total assigned",
          description: `${taskCounts.total} task${taskCounts.total === 1 ? "" : "s"} assigned to you.`,
          viewAllHref: "/member/tasks",
          viewAllLabel: "View all tasks",
          isEmpty: tasks.length === 0,
          content: <TaskPreviewList tasks={sortedTasks} role="team_member" />,
        };
      case METRIC_KEYS.dueSoon:
        return {
          title: "Due soon",
          description: `${dueSoon.length} task${dueSoon.length === 1 ? "" : "s"} due within 3 days.`,
          viewAllHref: "/member/tasks?filter=due-soon",
          viewAllLabel: "View all tasks",
          isEmpty: dueSoon.length === 0,
          emptyMessage: "No tasks due soon.",
          content: (
            <TaskPreviewList tasks={sortTasksByUrgency(dueSoon)} role="team_member" />
          ),
        };
      case METRIC_KEYS.overdue:
        return {
          title: "Overdue",
          description: `${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}.`,
          viewAllHref: "/member/tasks?filter=overdue",
          viewAllLabel: "View all tasks",
          isEmpty: overdue.length === 0,
          emptyMessage: "No overdue tasks.",
          content: (
            <TaskPreviewList tasks={sortTasksByUrgency(overdue)} role="team_member" />
          ),
        };
      case METRIC_KEYS.completed:
        return {
          title: "Completed",
          description: `${taskCounts.done} completed task${taskCounts.done === 1 ? "" : "s"}.`,
          viewAllHref: "/member/tasks?filter=completed",
          viewAllLabel: "View all tasks",
          isEmpty: completedTasks.length === 0,
          emptyMessage: "No completed tasks yet.",
          content: <TaskPreviewList tasks={completedTasks} role="team_member" />,
        };
      case METRIC_KEYS.assignedProjects:
        return {
          title: "Assigned projects",
          description: `${projectsWithTasks.length} project${projectsWithTasks.length === 1 ? "" : "s"} with tasks assigned to you.`,
          viewAllLabel: "View assigned projects",
          onViewAll: scrollToAssignedProjects,
          isEmpty: projectsWithTasks.length === 0,
          content: (
            <ProjectPreviewList
              projects={projectsWithTasks}
              role="team_member"
              getMeta={(project) =>
                `${project.taskCount} ${project.taskCount === 1 ? "task" : "tasks"}`
              }
            />
          ),
        };
      case METRIC_KEYS.inProgress:
        return {
          title: "In progress",
          description: `${inProgressTasks.length} task${inProgressTasks.length === 1 ? "" : "s"} currently in progress.`,
          viewAllHref: "/member/tasks",
          viewAllLabel: "View all tasks",
          isEmpty: inProgressTasks.length === 0,
          emptyMessage: "No tasks in progress.",
          content: (
            <TaskPreviewList
              tasks={sortTasksByUrgency(inProgressTasks)}
              role="team_member"
            />
          ),
        };
      default:
        return null;
    }
  }

  const dialogConfig = getDialogConfig();

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Total assigned"
          value={taskCounts.total}
          tone="emerald"
          onClick={() => setActiveMetric(METRIC_KEYS.total)}
        />
        <MetricCard
          label="Due soon"
          value={dueSoon.length}
          tone="blue"
          onClick={() => setActiveMetric(METRIC_KEYS.dueSoon)}
        />
        <MetricCard
          label="Overdue"
          value={overdue.length}
          tone="rose"
          onClick={() => setActiveMetric(METRIC_KEYS.overdue)}
        />
        <MetricCard
          label="Completed"
          value={taskCounts.done}
          tone="teal"
          onClick={() => setActiveMetric(METRIC_KEYS.completed)}
        />
        <MetricCard
          label="Assigned projects"
          value={projectsWithTasks.length}
          tone="violet"
          onClick={() => setActiveMetric(METRIC_KEYS.assignedProjects)}
        />
        <MetricCard
          label="In progress"
          value={inProgressTasks.length}
          tone="amber"
          onClick={() => setActiveMetric(METRIC_KEYS.inProgress)}
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
          onViewAll={dialogConfig.onViewAll}
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

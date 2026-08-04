import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getMilestoneDetailPath,
  getProjectTasksPath,
} from "@/lib/projectPaths";
import { getStatusColor } from "@/lib/taskStatusConfig";

function Section({ title, count, children, emptyMessage }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-text-primary">{title}</h3>
        {count > 0 ? (
          <Badge variant="muted">{count}</Badge>
        ) : null}
      </div>
      {count === 0 ? (
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

function TaskListItem({ task, projectId, columns, variant, role }) {
  const isDone = variant === "done";

  return (
    <li>
      <Link
        to={getProjectTasksPath(role, projectId, task._id)}
        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-card-hover"
      >
        <span className="flex min-w-0 items-center gap-2 font-medium text-text-primary">
          {isDone ? (
            <Icon
              icon="lucide:check-circle-2"
              className="h-4 w-4 shrink-0 text-green-600"
            />
          ) : (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: getStatusColor(columns, task.status),
              }}
            />
          )}
          <span className={isDone ? "line-through opacity-80" : ""}>
            {task.title}
          </span>
        </span>
        {task.assignee?.name ? (
          <span className="shrink-0 text-xs text-text-muted">
            {task.assignee.name}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function DaySchedulerPanel({
  day,
  events,
  projectId,
  columns,
  role = "project_manager",
  onAddSchedule,
}) {
  if (!day) {
    return (
      <Card className="flex h-full min-h-[24rem] flex-col items-center justify-center p-8 text-center">
        <Icon
          icon="lucide:calendar-days"
          className="mb-3 h-10 w-10 text-text-muted"
        />
        <p className="text-sm font-medium text-text-primary">
          Select a day to view the schedule
        </p>
        <p className="mt-1 text-sm text-text-secondary">
          See what is planned and what was completed.
        </p>
      </Card>
    );
  }

  const { scheduledTasks, doneTasks, milestones } = events;

  return (
    <Card className="flex h-full min-h-[24rem] flex-col overflow-hidden p-0">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
              Day schedule
            </p>
            <h2 className="mt-1 text-lg font-semibold text-text-primary">
              {format(day, "EEEE, MMM d")}
            </h2>
          </div>
          <Button type="button" size="sm" onClick={onAddSchedule}>
            <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <Section
          title="Scheduled"
          count={scheduledTasks.length}
          emptyMessage="Nothing scheduled for this day."
        >
          <ul className="divide-y divide-border rounded-lg border border-border">
            {scheduledTasks.map((task) => (
              <TaskListItem
                key={task._id}
                task={task}
                projectId={projectId}
                columns={columns}
                variant="scheduled"
                role={role}
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Completed"
          count={doneTasks.length}
          emptyMessage="No tasks were completed on this day."
        >
          <ul className="divide-y divide-border rounded-lg border border-border">
            {doneTasks.map((task) => (
              <TaskListItem
                key={task._id}
                task={task}
                projectId={projectId}
                columns={columns}
                variant="done"
                role={role}
              />
            ))}
          </ul>
        </Section>

        <Section
          title="Milestones"
          count={milestones.length}
          emptyMessage="No milestones due on this day."
        >
          <ul className="divide-y divide-border rounded-lg border border-border">
            {milestones.map((milestone) => (
              <li key={milestone._id}>
                <Link
                  to={getMilestoneDetailPath(role, projectId, milestone._id)}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-card-hover"
                >
                  <span className="flex items-center gap-2 font-medium text-text-primary">
                    <Icon
                      icon="lucide:flag"
                      className="h-3.5 w-3.5 text-amber-600"
                    />
                    {milestone.name}
                  </span>
                  <Badge variant="muted">{milestone.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </Card>
  );
}

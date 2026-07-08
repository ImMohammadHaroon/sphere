import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function memberInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function priorityBadgeVariant(priority) {
  switch (priority) {
    case "high":
      return "danger";
    case "low":
      return "muted";
    default:
      return "default";
  }
}

export function KanbanTaskCardContent({ task, taskDetailPath, className }) {
  const assigneeName = task.assignee?.name ?? null;
  const dueLabel = formatDate(task.dueDate);

  const body = (
    <>
      <p className="text-sm font-medium text-text-primary">{task.title}</p>

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <Badge variant={priorityBadgeVariant(task.priority)}>
          {task.priority}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-medium text-primary">
            {memberInitials(assigneeName)}
          </div>
          <span>{assigneeName ?? "Unassigned"}</span>
        </div>
        {dueLabel ? <span>Due {dueLabel}</span> : null}
      </div>
    </>
  );

  if (taskDetailPath) {
    return (
      <Link to={taskDetailPath} className={cn("block space-y-2", className)}>
        {body}
      </Link>
    );
  }

  return <div className={cn("space-y-2", className)}>{body}</div>;
}

export function KanbanTaskCard({ task, canMove, taskDetailPath }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    disabled: !canMove,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-surface-raised p-3 shadow-sm",
        isDragging && "opacity-50"
      )}
      {...attributes}
    >
      <div className="flex gap-2">
        {canMove ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="mt-0.5 shrink-0 cursor-grab touch-none text-text-muted active:cursor-grabbing"
            aria-label={`Drag task ${task.title}`}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <KanbanTaskCardContent task={task} taskDetailPath={taskDetailPath} />
        </div>
      </div>
    </div>
  );
}

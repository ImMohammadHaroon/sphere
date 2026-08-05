import { Link } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { TaskStatusBadge } from "@/features/tasks/components/TaskStatusBadge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatTimestamp } from "@/lib/dateTimeUtils";
import { cn } from "@/lib/utils";

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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

export function KanbanTaskCardContent({
  task,
  columns,
  taskDetailPath,
  onTaskClick,
  isSelected,
  className,
}) {
  const assignee = task.assignee ?? null;
  const assigneeName = assignee?.name ?? null;
  const creator = task.createdBy ?? null;
  const creatorName = creator?.name ?? null;
  const dueLabel = formatDate(task.dueDate);
  const createdLabel = formatTimestamp(task.createdAt);
  const updatedLabel =
    task.updatedAt &&
    task.createdAt &&
    new Date(task.updatedAt).getTime() !== new Date(task.createdAt).getTime()
      ? formatTimestamp(task.updatedAt)
      : null;

  const body = (
    <>
      <p className="text-sm font-medium text-text-primary">{task.title}</p>

      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} columns={columns} />
        <Badge variant={priorityBadgeVariant(task.priority)}>
          {task.priority}
        </Badge>
      </div>

      <div className="space-y-1 text-xs text-text-secondary">
        {creatorName ? (
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Created by</span>
            <UserAvatar user={creator} size="xs" />
            <span>{creatorName}</span>
          </div>
        ) : null}
        {createdLabel ? (
          <p className="text-text-muted">Created {createdLabel}</p>
        ) : null}
        {updatedLabel ? (
          <p className="text-text-muted">Updated {updatedLabel}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-text-muted">For</span>
            <UserAvatar user={assignee} size="xs" />
            <span>{assigneeName ?? "Unassigned"}</span>
          </div>
          {dueLabel ? <span>Due {dueLabel}</span> : null}
        </div>
      </div>
    </>
  );

  if (onTaskClick) {
    return (
      <button
        type="button"
        onClick={() => onTaskClick(task._id)}
        className={cn(
          "block w-full space-y-2 rounded-md text-left transition-colors hover:bg-primary-subtle/20",
          isSelected && "bg-primary-subtle/10",
          className
        )}
      >
        {body}
      </button>
    );
  }

  if (taskDetailPath) {
    return (
      <Link to={taskDetailPath} className={cn("block space-y-2", className)}>
        {body}
      </Link>
    );
  }

  return <div className={cn("space-y-2", className)}>{body}</div>;
}

export function KanbanTaskCard({
  task,
  columns,
  canMove,
  taskDetailPath,
  onTaskClick,
  isSelected,
}) {
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
        "rounded-lg border bg-surface-raised p-3 shadow-sm transition-all",
        isDragging && "opacity-50",
        isSelected
          ? "border-primary bg-primary-subtle/30 shadow-md ring-2 ring-primary/20"
          : "border-border hover:border-primary/30"
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
          <KanbanTaskCardContent
            task={task}
            columns={columns}
            taskDetailPath={taskDetailPath}
            onTaskClick={onTaskClick}
            isSelected={isSelected}
          />
        </div>
      </div>
    </div>
  );
}

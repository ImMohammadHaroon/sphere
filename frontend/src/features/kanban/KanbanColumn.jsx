import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { getStatusColor, getStatusLabel } from "@/lib/taskStatusConfig";
import { cn } from "@/lib/utils";
import { KanbanTaskCard } from "./KanbanTaskCard";

export function KanbanColumn({
  status,
  columns,
  tasks,
  canMoveTask,
  taskDetailPathForTask,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
  });

  const taskIds = tasks.map((task) => task._id);
  const accentColor = getStatusColor(columns, status);

  return (
    <div className="flex min-h-[24rem] w-72 shrink-0 flex-col rounded-lg border border-border bg-surface">
      <div className="flex items-center gap-2 border-b border-border px-3 py-3">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: accentColor }}
          aria-hidden
        />
        <h3 className="text-sm font-medium text-text-primary">
          {getStatusLabel(columns, status)}
        </h3>
        <span className="ml-auto text-xs text-text-muted">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 p-2 transition-colors",
          isOver && "bg-primary-subtle/40"
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanTaskCard
              key={task._id}
              task={task}
              columns={columns}
              canMove={canMoveTask(task)}
              taskDetailPath={taskDetailPathForTask(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-text-muted">
            Drop tasks here
          </p>
        ) : null}
      </div>
    </div>
  );
}

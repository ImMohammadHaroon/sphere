import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { useProject } from "@/features/projects/hooks/useProjects";
import {
  DEFAULT_BOARD_COLUMNS,
  getSortedColumns,
} from "@/lib/taskStatusConfig";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanTaskCardContent } from "./KanbanTaskCard";
import { useKanbanTasks } from "./useKanbanTasks";

function viewerInitials(userId) {
  return userId.slice(-2).toUpperCase();
}

function PresenceAvatars({ viewers, currentUserId }) {
  const others = viewers.filter((id) => id !== currentUserId);

  if (others.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-muted">Viewing</span>
      <div className="flex -space-x-2">
        {others.map((userId) => (
          <div
            key={userId}
            title={userId}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface-raised bg-primary-subtle text-xs font-medium text-primary"
          >
            {viewerInitials(userId)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ projectId, canMoveTask }) {
  const { user } = useAuth();
  const { toast, showToast, dismissToast } = useToast();
  const [activeId, setActiveId] = useState(null);

  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
    isFetching: projectFetching,
  } = useProject(projectId);

  const columns = useMemo(() => {
    if (project?.columns?.length) {
      return getSortedColumns(project.columns);
    }
    return DEFAULT_BOARD_COLUMNS;
  }, [project?.columns]);

  const canMove = useMemo(
    () => canMoveTask ?? (() => true),
    [canMoveTask]
  );

  const {
    tasks,
    tasksByStatus,
    isLoading: tasksLoading,
    error: tasksError,
    viewers,
    refetch: refetchTasks,
    handleDragEnd,
  } = useKanbanTasks(projectId, columns, {
    onError: (err) => showToast(err.message, "error"),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const activeTask = activeId
    ? tasks.find((task) => task._id === activeId)
    : null;

  const isLoading = projectLoading || tasksLoading;
  const error = projectError ?? tasksError;

  function taskDetailPathForTask(task) {
    if (user?.role === "team_member") {
      return `/member/projects/${projectId}/tasks/${task._id}`;
    }
    return `/dashboard/projects/${projectId}/tasks/${task._id}`;
  }

  function handleRetry() {
    refetchProject();
    refetchTasks();
  }

  if (!projectId) {
    return (
      <Card className="p-8 text-center">
        <p className="text-text-secondary">
          Select a project to open its Kanban board.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <Skeleton key={column.key} className="h-[24rem] w-72 shrink-0" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">{error.message}</p>
        <Button
          className="mt-4"
          onClick={handleRetry}
          isLoading={projectFetching}
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {tasks.length} task{tasks.length === 1 ? "" : "s"} on this board
        </p>
        <PresenceAvatars viewers={viewers} currentUserId={user?.id} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={(event) => {
          const { active, over } = event;
          setActiveId(null);

          if (!over) {
            return;
          }

          const task = tasks.find((item) => item._id === active.id);
          if (task && !canMove(task)) {
            return;
          }

          handleDragEnd(active.id, over.id);
        }}
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((column) => (
            <KanbanColumn
              key={column.key}
              status={column.key}
              columns={columns}
              tasks={tasksByStatus[column.key] ?? []}
              canMoveTask={canMove}
              taskDetailPathForTask={taskDetailPathForTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rotate-2 rounded-lg border border-border bg-surface-raised p-3 opacity-90 shadow-lg">
              <KanbanTaskCardContent task={activeTask} columns={columns} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}

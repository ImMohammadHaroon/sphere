import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { KanbanTaskPanel } from "@/features/kanban/KanbanTaskPanel";

export function ProjectTasksTab({
  projectId,
  selectedTaskId,
  onTaskSelect,
}) {
  return (
    <div className="space-y-8">
      <KanbanBoard
        projectId={projectId}
        selectedTaskId={selectedTaskId}
        onTaskSelect={onTaskSelect}
      />

      <KanbanTaskPanel
        taskId={selectedTaskId}
        projectId={projectId}
        onClose={() => onTaskSelect(null)}
      />
    </div>
  );
}

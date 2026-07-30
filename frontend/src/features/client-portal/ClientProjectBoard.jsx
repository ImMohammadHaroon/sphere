import { useState } from "react";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { KanbanTaskPanel } from "@/features/kanban/KanbanTaskPanel";

export function ClientProjectBoard({ projectId }) {
  const [selectedTaskId, setSelectedTaskId] = useState("");

  function handleTaskSelect(taskId) {
    setSelectedTaskId((current) => (current === taskId ? "" : taskId));
  }

  return (
    <div className="space-y-6">
      <KanbanBoard
        projectId={projectId}
        canMoveTask={() => false}
        readOnly
        selectedTaskId={selectedTaskId}
        onTaskSelect={handleTaskSelect}
      />

      <KanbanTaskPanel
        taskId={selectedTaskId}
        projectId={projectId}
        onClose={() => setSelectedTaskId("")}
      />
    </div>
  );
}

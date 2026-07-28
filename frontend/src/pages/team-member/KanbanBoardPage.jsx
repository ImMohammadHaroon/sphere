import { useParams, useSearchParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { KanbanTaskPanel } from "@/features/kanban/KanbanTaskPanel";

export function TeamMemberKanbanBoardPage() {
  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get("task") ?? "";

  useDashboardPageMeta({
    title: "Kanban board",
    description: "View and update tasks on the board.",
    showBack: true,
    backLabel: "Back to dashboard",
    backTo: "/member",
  });

  function handleTaskSelect(taskId) {
    if (!taskId || taskId === selectedTaskId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("task");
      setSearchParams(nextParams);
      return;
    }

    setSearchParams({ task: taskId });
  }

  return (
    <div className="space-y-8">
      <KanbanBoard
        projectId={projectId}
        selectedTaskId={selectedTaskId}
        onTaskSelect={handleTaskSelect}
      />

      <KanbanTaskPanel
        taskId={selectedTaskId}
        projectId={projectId}
        onClose={() => handleTaskSelect(null)}
      />
    </div>
  );
}

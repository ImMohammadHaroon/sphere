import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { useAuth } from "@/hooks/useAuth";

export function TeamMemberKanbanBoardPage() {
  useDashboardPageMeta({
    title: "Kanban board",
    description: "View and update tasks on the board.",
  });

  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";
  const { user } = useAuth();

  const canMoveTask = (task) => task.assigneeId === user?.id;

  return (
    <KanbanBoard projectId={projectId} canMoveTask={canMoveTask} />
  );
}

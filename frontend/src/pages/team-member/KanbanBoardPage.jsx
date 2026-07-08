import { useParams } from "react-router-dom";
import { TeamMemberLayout } from "@/components/layout/TeamMemberLayout";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { useAuth } from "@/hooks/useAuth";

export function TeamMemberKanbanBoardPage() {
  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";
  const { user } = useAuth();

  const canMoveTask = (task) => task.assigneeId === user?.id;

  return (
    <TeamMemberLayout
      title="Kanban board"
      description="View and update tasks on the board."
    >
      <KanbanBoard projectId={projectId} canMoveTask={canMoveTask} />
    </TeamMemberLayout>
  );
}

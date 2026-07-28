import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";

export function KanbanBoardPage() {
  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";

  useDashboardPageMeta({
    title: "Kanban board",
    description: "Track tasks across columns by status.",
    showBack: Boolean(projectId),
    backLabel: "Back to project",
    backTo: projectId ? `/dashboard/projects/${projectId}` : undefined,
  });

  return <KanbanBoard projectId={projectId} />;
}

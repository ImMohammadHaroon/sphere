import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { KanbanBoard } from "@/features/kanban/KanbanBoard";
import { ButtonLink } from "@/components/ui/ButtonLink";

export function KanbanBoardPage() {
  useDashboardPageMeta({
    title: "Kanban board",
    description: "Track tasks across columns by status.",
  });

  const { id, projectId: routeProjectId } = useParams();
  const projectId = routeProjectId || id || "";

  return (
    <>
      {projectId ? (
        <div className="mb-4">
          <ButtonLink
            to={`/dashboard/projects/${projectId}`}
            variant="ghost"
            size="sm"
          >
            ← Back to project
          </ButtonLink>
        </div>
      ) : null}

      <KanbanBoard projectId={projectId} />
    </>
  );
}

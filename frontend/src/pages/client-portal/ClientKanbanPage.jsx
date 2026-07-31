import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { ClientProjectBoard } from "@/features/client-portal/ClientProjectBoard";
import { useProject } from "@/features/projects/hooks/useProjects";

export function ClientKanbanPage() {
  const { projectId = "" } = useParams();
  const { data: project } = useProject(projectId);

  useDashboardPageMeta({
    title: project?.name ? `${project.name}` : "Work progress",
    description: "See what your team is working on.",
    showBack: true,
    backLabel: "Back to projects",
    backTo: "/portal",
  });

  return <ClientProjectBoard projectId={projectId} />;
}

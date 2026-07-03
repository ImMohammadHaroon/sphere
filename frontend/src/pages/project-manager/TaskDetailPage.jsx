import { useParams } from "react-router-dom";
import { ProjectManagerPlaceholder } from "@/components/layout/ProjectManagerLayout";

export function TaskDetailPage() {
  const { taskId = "" } = useParams();

  return (
    <ProjectManagerPlaceholder
      title="Task detail"
      description={
        taskId
          ? `View and edit task ${taskId}.`
          : "View and edit a single task."
      }
    />
  );
}

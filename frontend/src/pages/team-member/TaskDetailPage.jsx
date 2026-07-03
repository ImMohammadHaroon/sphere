import { useParams } from "react-router-dom";
import { TeamMemberPlaceholder } from "@/components/layout/TeamMemberLayout";

export function TeamMemberTaskDetailPage() {
  const { taskId = "" } = useParams();

  return (
    <TeamMemberPlaceholder
      title="Task detail"
      description={
        taskId
          ? `View and update task ${taskId}.`
          : "View and update a single task."
      }
    />
  );
}

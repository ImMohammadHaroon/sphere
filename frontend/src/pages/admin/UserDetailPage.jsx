import { useParams } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";

export function UserDetailPage() {
  const { id } = useParams();

  useDashboardPageMeta({
    title: "User detail",
    description: id
      ? `User id: ${id}`
      : "View and edit a team member's role and status.",
  });

  return null;
}

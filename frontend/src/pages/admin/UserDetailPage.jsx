import { useParams } from "react-router-dom";
import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";

export function UserDetailPage() {
  const { id } = useParams();

  return (
    <OrgAdminLayout
      title="User detail"
      description={id ? `User id: ${id}` : "View and edit a team member's role and status."}
    />
  );
}

import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function OrgAdminTaskRedirect() {
  const { projectId, taskId } = useParams();

  return (
    <Navigate
      to={`/admin/projects/${projectId}?tab=tasks&task=${taskId}`}
      replace
    />
  );
}

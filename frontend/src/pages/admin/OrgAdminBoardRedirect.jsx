import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function OrgAdminBoardRedirect() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const nextParams = new URLSearchParams(searchParams);
  if (!nextParams.has("tab")) {
    nextParams.set("tab", "tasks");
  }
  const query = nextParams.toString();

  return (
    <Navigate
      to={`/admin/projects/${id}${query ? `?${query}` : ""}`}
      replace
    />
  );
}

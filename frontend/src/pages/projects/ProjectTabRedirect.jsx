import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function ProjectTabRedirect({ tab }) {
  const { id, projectId } = useParams();
  const resolvedProjectId = projectId || id;
  const [searchParams] = useSearchParams();
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", tab);

  return (
    <Navigate
      to={`/dashboard/projects/${resolvedProjectId}?${nextParams.toString()}`}
      replace
    />
  );
}

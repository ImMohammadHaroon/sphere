import { Navigate, useParams, useSearchParams } from "react-router-dom";

export function TeamMemberBoardRedirect() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const nextParams = new URLSearchParams(searchParams);
  nextParams.set("tab", "tasks");

  return (
    <Navigate
      to={`/member/projects/${projectId}?${nextParams.toString()}`}
      replace
    />
  );
}

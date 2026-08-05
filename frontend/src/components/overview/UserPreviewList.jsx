import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/hooks/useAuth";

const PREVIEW_LIMIT = 5;

function formatRole(role) {
  return role?.replaceAll("_", " ") ?? "—";
}

function roleBadgeVariant(role) {
  switch (role) {
    case "super_admin":
      return "accent";
    case "org_admin":
      return "success";
    case "project_manager":
      return "default";
    case "client":
      return "muted";
    default:
      return "default";
  }
}

function getUserId(user) {
  return user._id ?? user.id;
}

function getUserDetailPath(role, userId, organizationId) {
  if (role === "super_admin") {
    const params = organizationId
      ? `?organizationId=${organizationId}`
      : "";
    return `/super-admin/users${params}`;
  }
  if (role === "org_admin" || role === "project_manager") {
    return `/admin/users/${userId}`;
  }
  return null;
}

export function UserPreviewList({
  users = [],
  limit = PREVIEW_LIMIT,
  role: roleOverride,
  organizationId,
  linkToDetail = true,
}) {
  const { user } = useAuth();
  const role = roleOverride ?? user?.role;
  const preview = users.slice(0, limit);

  if (preview.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {preview.map((member) => {
        const userId = getUserId(member);
        const detailPath = linkToDetail
          ? getUserDetailPath(role, userId, organizationId ?? member.organizationId)
          : null;

        const content = (
          <>
            <UserAvatar user={member} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-text-primary">
                {member.name}
              </p>
              <p className="truncate text-sm text-text-secondary">
                {member.email}
              </p>
            </div>
            {member.role ? (
              <Badge variant={roleBadgeVariant(member.role)}>
                {formatRole(member.role)}
              </Badge>
            ) : null}
          </>
        );

        return (
          <li key={userId}>
            {detailPath ? (
              <Link
                to={detailPath}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

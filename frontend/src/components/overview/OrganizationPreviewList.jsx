import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";

const PREVIEW_LIMIT = 5;

function formatDate(value) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getOrgId(org) {
  return org._id ?? org.id;
}

export function OrganizationPreviewList({
  organizations = [],
  limit = PREVIEW_LIMIT,
  showPending = false,
}) {
  const preview = organizations.slice(0, limit);

  if (preview.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {preview.map((org) => {
        const orgId = getOrgId(org);
        const created = formatDate(org.createdAt);

        return (
          <li key={orgId}>
            <Link
              to={`/super-admin/organizations/${orgId}`}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text-primary">
                  {org.name}
                </p>
                <p className="truncate text-sm text-text-secondary">
                  {[
                    org.userCount != null
                      ? `${org.userCount} ${org.userCount === 1 ? "user" : "users"}`
                      : null,
                    created ? `Joined ${created}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {showPending ? (
                <Badge variant="accent">Pending</Badge>
              ) : org.isActive != null ? (
                <Badge variant={org.isActive ? "success" : "danger"}>
                  {org.isActive ? "Active" : "Suspended"}
                </Badge>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

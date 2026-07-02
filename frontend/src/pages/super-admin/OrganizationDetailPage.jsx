import { useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { usePlatformOrganization } from "@/features/platform/hooks/usePlatformOrganization";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function planBadgeVariant(plan) {
  switch (plan) {
    case "enterprise":
      return "success";
    case "pro":
      return "accent";
    default:
      return "muted";
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OrganizationDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformOrganization(id);

  return (
    <SuperAdminLayout
      title="Organization detail"
      description="Organization plan, usage, and status."
    >
      <div className="mb-6">
        <ButtonLink to="/super-admin/organizations" variant="outline" size="sm">
          Back to organizations
        </ButtonLink>
      </div>

      {isLoading ? (
        <Card className="max-w-2xl space-y-4 p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-40" />
        </Card>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load organization."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        <Card className="max-w-2xl space-y-4 p-6">
          <div>
            <p className="text-sm text-text-muted">Name</p>
            <p className="text-lg font-semibold">{data.name}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Plan</p>
            <Badge variant={planBadgeVariant(data.plan)}>{data.plan}</Badge>
          </div>
          <div>
            <p className="text-sm text-text-muted">Users</p>
            <p className="font-medium">{data.userCount}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Status</p>
            <Badge variant={data.isActive ? "success" : "danger"}>
              {data.isActive ? "Active" : "Suspended"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-text-muted">Created</p>
            <p className="font-medium">{formatDate(data.createdAt)}</p>
          </div>
        </Card>
      ) : null}
    </SuperAdminLayout>
  );
}

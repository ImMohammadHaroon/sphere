import { Link } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { usePlatformOrganizations } from "@/features/platform/hooks/usePlatformOrganizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

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

export function OrganizationsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformOrganizations();

  return (
    <SuperAdminLayout title="Organizations" description="All organizations on the platform.">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load organizations."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        data.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No organizations registered yet.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((org) => (
                  <TableRow key={org._id}>
                    <TableCell>
                      <Link
                        to={`/super-admin/organizations/${org._id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={planBadgeVariant(org.plan)}>{org.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {org.userCount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={org.isActive ? "success" : "danger"}>
                        {org.isActive ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(org.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : null}
    </SuperAdminLayout>
  );
}

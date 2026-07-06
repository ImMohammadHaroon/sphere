import { OrgAdminLayout } from "@/components/layout/OrgAdminLayout";
import { useProjects } from "@/features/projects/hooks/useProjects";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export function OrgOverviewPage() {
  const { data: projects, isLoading, isError, error, refetch, isFetching } =
    useProjects();

  const activeCount = projects?.filter((p) => p.status === "active").length ?? 0;
  const archivedCount = projects?.filter((p) => p.status === "archived").length ?? 0;

  return (
    <OrgAdminLayout
      title="Org overview"
      description="Active projects, team size, and organization KPIs."
    >
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load overview."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && projects ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4 sm:p-6">
            <p className="text-sm text-text-muted">Total projects</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">{projects.length}</p>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-sm text-text-muted">Active</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">{activeCount}</p>
            <Badge className="mt-2" variant="success">
              active
            </Badge>
          </Card>
          <Card className="p-4 sm:p-6">
            <p className="text-sm text-text-muted">Archived</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">{archivedCount}</p>
            <Badge className="mt-2" variant="muted">
              archived
            </Badge>
          </Card>
        </div>
      ) : null}
    </OrgAdminLayout>
  );
}

import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { useOrganizationDetail } from "@/features/platform/hooks/useOrganizationDetail";
import { useOrganizationActions } from "@/features/platform/hooks/useOrganizationActions";
import { ConfirmSlugDialog } from "@/pages/admin/settings/ConfirmSlugDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";
import { useToast } from "@/hooks/useToast";

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRole(role) {
  return role.replaceAll("_", " ");
}

function MetricCard({ label, value }) {
  return (
    <Card className="bg-primary-subtle/60 p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-primary sm:text-3xl">
        {value.toLocaleString()}
      </p>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-40" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </div>
  );
}

export function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, dismissToast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrganizationDetail(id);
  const { suspend, activate, remove } = useOrganizationActions(id);

  const organization = data?.organization;
  const members = data?.members ?? [];
  const projects = data?.projects ?? [];
  const stats = data?.stats;

  async function handleSuspendConfirm() {
    try {
      await suspend.mutateAsync();
      showToast("Organization suspended.");
      setSuspendOpen(false);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Action failed",
        "error"
      );
      throw err;
    }
  }

  async function handleActivate() {
    try {
      await activate.mutateAsync();
      showToast("Organization activated.");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Action failed",
        "error"
      );
    }
  }

  async function handleDelete(confirmSlug) {
    await remove.mutateAsync(confirmSlug);
    showToast("Organization deleted.");
    navigate("/super-admin/organizations", { replace: true });
  }

  const isMutating = suspend.isPending || activate.isPending || remove.isPending;

  return (
    <SuperAdminLayout
      title={organization?.name ?? "Organization detail"}
      description={
        organization
          ? `Read-only oversight for ${organization.slug}.`
          : "Organization members, projects, and status."
      }
    >
      {toast ? <Toast toast={toast} onDismiss={dismissToast} /> : null}

      {isLoading ? <DetailSkeleton /> : null}

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

      {!isLoading && !isError && organization ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <ButtonLink to="/super-admin/organizations" variant="outline" size="sm">
              Back to organizations
            </ButtonLink>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  organization.isActive ? setSuspendOpen(true) : handleActivate()
                }
                isLoading={suspend.isPending || activate.isPending}
                disabled={isMutating}
              >
                {organization.isActive ? "Suspend" : "Activate"}
              </Button>
              <Button
                variant="danger"
                onClick={() => setDeleteOpen(true)}
                disabled={isMutating}
              >
                Delete organization
              </Button>
            </div>
          </div>

          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold sm:text-2xl">
                  {organization.name}
                </h2>
                <p className="mt-1 font-mono text-sm text-text-muted">
                  {organization.slug}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={organization.isActive ? "success" : "danger"}>
                  {organization.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-text-secondary">
              <p>
                <span className="text-text-muted">Timezone:</span>{" "}
                {organization.timezone}
              </p>
              <p>
                <span className="text-text-muted">Created:</span>{" "}
                {formatDate(organization.createdAt)}
              </p>
            </div>
          </Card>

          {stats ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label="Users" value={stats.userCount} />
              <MetricCard label="Projects" value={stats.projectCount} />
              <MetricCard label="Tasks" value={stats.taskCount} />
            </div>
          ) : null}

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-4 sm:px-6">
              <h3 className="font-display text-lg font-semibold">Members</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Read-only list of organization users.
              </p>
            </div>
            {members.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-secondary sm:px-6">
                No members in this organization.
              </p>
            ) : (
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-text-secondary">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="muted">{formatRole(member.role)}</Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(member.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            )}
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border px-4 py-4 sm:px-6">
              <h3 className="font-display text-lg font-semibold">Projects</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Read-only project summary. No task or Kanban drill-down.
              </p>
            </div>
            {projects.length === 0 ? (
              <p className="px-4 py-8 text-sm text-text-secondary sm:px-6">
                No projects in this organization.
              </p>
            ) : (
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={project.status === "active" ? "success" : "muted"}
                          >
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {project.taskCount}
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(project.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            )}
          </Card>

          <ConfirmDialog
            open={suspendOpen}
            onOpenChange={setSuspendOpen}
            title="Suspend organization"
            description={`Suspend ${organization.name}? All members will be unable to sign in until the organization is reactivated.`}
            confirmLabel="Suspend organization"
            onConfirm={handleSuspendConfirm}
            isLoading={suspend.isPending}
          />

          <ConfirmSlugDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete organization"
            description="This soft-deletes the organization. It will be hidden from the platform list and return 404 on access."
            confirmLabel="Delete organization"
            slug={organization.slug}
            onConfirm={handleDelete}
            isLoading={remove.isPending}
            variant="danger"
          />
        </div>
      ) : null}
    </SuperAdminLayout>
  );
}

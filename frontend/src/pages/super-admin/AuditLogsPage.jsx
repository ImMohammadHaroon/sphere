import { useState } from "react";
import { Link } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
import { usePlatformAuditLogs } from "@/features/platform/hooks/usePlatformAuditLogs";
import { useOrganizations } from "@/features/platform/hooks/useOrganizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableScrollArea,
} from "@/components/ui/Table";
import { cn } from "@/lib/utils";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: "project.created", label: "Project created" },
  { value: "project.updated", label: "Project updated" },
  { value: "project.deleted", label: "Project deleted" },
  { value: "task.created", label: "Task created" },
  { value: "task.updated", label: "Task updated" },
  { value: "task.deleted", label: "Task deleted" },
  { value: "user.invited", label: "User invited" },
  { value: "invite.accepted", label: "Invite accepted" },
  { value: "invite.revoked", label: "Invite revoked" },
  { value: "user.role_changed", label: "Role changed" },
  { value: "user.removed", label: "User removed" },
  { value: "org.settings_updated", label: "Settings updated" },
  { value: "org.deactivated", label: "Org deactivated" },
  { value: "org.deleted", label: "Org deleted" },
  { value: "organization.suspended", label: "Organization suspended" },
  { value: "organization.activated", label: "Organization activated" },
  { value: "organization.deleted", label: "Organization deleted" },
  { value: "auth.login", label: "Login" },
  { value: "auth.login_failed", label: "Login failed" },
  { value: "org.created", label: "Organization created" },
  { value: "rbac.access_denied", label: "Access denied" },
];

function actionBadgeVariant(action) {
  if (
    action === "rbac.access_denied" ||
    action === "organization.deleted" ||
    action === "organization.suspended"
  ) {
    return "danger";
  }
  if (action.includes("created") || action.includes("accepted")) {
    return "success";
  }
  return "default";
}

function formatTimestamp(value) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMetadata(metadata) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "—";
  }

  const parts = [];

  if (metadata.from !== undefined && metadata.to !== undefined) {
    parts.push(`${metadata.from} → ${metadata.to}`);
  }

  if (metadata.email) {
    parts.push(metadata.email);
  }

  if (metadata.name) {
    parts.push(metadata.name);
  }

  if (metadata.attemptedAction) {
    parts.push(metadata.attemptedAction);
  }

  if (metadata.reason) {
    parts.push(metadata.reason);
  }

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  const summary = JSON.stringify(metadata);
  return summary.length > 80 ? `${summary.slice(0, 77)}…` : summary;
}

function toStartOfDayIso(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T00:00:00`).toISOString();
}

function toEndOfDayIso(dateStr) {
  if (!dateStr) return undefined;
  return new Date(`${dateStr}T23:59:59.999`).toISOString();
}

const PAGE_SIZE = 10;

export function SuperAdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: orgData } = useOrganizations({ page: 1, limit: 100 });
  const organizations = orgData?.organizations ?? [];

  const { data, isLoading, isError, error, refetch, isFetching } =
    usePlatformAuditLogs({
      page,
      limit: PAGE_SIZE,
      action: action || undefined,
      organizationId: organizationId || undefined,
      startDate: toStartOfDayIso(startDate),
      endDate: toEndOfDayIso(endDate),
    });

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
  }

  function clearFilters() {
    setAction("");
    setOrganizationId("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const hasFilters = Boolean(action || organizationId || startDate || endDate);

  return (
    <SuperAdminLayout
      title="Audit logs"
      description="Platform-wide audit trail across all organizations."
    >
      <Card className="mb-6 p-4 sm:p-6">
        <form
          onSubmit={applyFilters}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="space-y-2">
            <Label htmlFor="action-filter">Action</Label>
            <select
              id="action-filter"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
              }}
              className={cn(
                "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization-filter">Organization</Label>
            <select
              id="organization-filter"
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                setPage(1);
              }}
              className={cn(
                "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
            >
              <option value="">All organizations</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start-date">From</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">To</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit" isLoading={isFetching}>
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </form>
      </Card>

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
            {error instanceof Error ? error.message : "Failed to load audit logs."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        logs.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">
              {hasFilters
                ? "No audit logs match your filters."
                : "No activity yet"}
            </p>
          </Card>
        ) : (
          <>
            <p className="mb-4 text-sm text-text-secondary">
              {total.toLocaleString()} event{total === 1 ? "" : "s"}
            </p>
            <Card className="overflow-hidden p-0">
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-text-secondary">
                          {formatTimestamp(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          {log.actor ? (
                            <div>
                              <p className="font-medium">{log.actor.name}</p>
                              <p className="text-xs text-text-muted">
                                {log.actor.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.organization ? (
                            <Link
                              to={`/super-admin/organizations/${log.organization.id}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {log.organization.name}
                            </Link>
                          ) : (
                            <span className="text-text-muted">Platform</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {log.targetType ? (
                            <span>
                              {log.targetType}
                              {log.targetId ? (
                                <span className="block max-w-[8rem] truncate font-mono text-xs text-text-muted">
                                  {log.targetId}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-text-secondary">
                          {formatMetadata(log.metadata)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </Card>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()} · Page{" "}
                {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )
      ) : null}
    </SuperAdminLayout>
  );
}

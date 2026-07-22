import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useOrganizations } from "@/features/platform/hooks/useOrganizations";
import {
  useApproveOrganization,
  usePendingOrganizations,
  useRejectOrganization,
} from "@/features/platform/hooks/usePendingOrganizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
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
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "true", label: "Active" },
  { value: "false", label: "Suspended" },
];

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseStatusFilter(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function OrganizationsPage() {
  useDashboardPageMeta({
    title: "Organizations",
    description:
      "Review pending registrations and manage organizations on the platform.",
  });

  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    isActive: undefined,
  });
  const [pendingFilters, setPendingFilters] = useState({ page: 1, limit: 20 });
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const { toast, showToast, dismissToast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrganizations(filters);

  const {
    data: pendingData,
    isLoading: isPendingLoading,
    isError: isPendingError,
    error: pendingError,
    refetch: refetchPending,
    isFetching: isPendingFetching,
  } = usePendingOrganizations(pendingFilters);

  const approve = useApproveOrganization();
  const reject = useRejectOrganization();

  function applyFilters(event) {
    event?.preventDefault();
    setPage(1);
    setFilters({
      page: 1,
      limit: 20,
      search: searchInput.trim(),
      isActive: parseStatusFilter(status),
    });
  }

  function clearFilters() {
    setSearchInput("");
    setStatus("");
    setPage(1);
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      isActive: undefined,
    });
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    setFilters((current) => ({ ...current, page: nextPage }));
  }

  function goToPendingPage(nextPage) {
    setPendingPage(nextPage);
    setPendingFilters((current) => ({ ...current, page: nextPage }));
  }

  async function handleApprove(org) {
    try {
      await approve.mutateAsync(org.id);
      showToast(`${org.name} approved`, "success");
      refetch();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to approve organization",
        "error"
      );
    }
  }

  async function handleRejectConfirm() {
    if (!rejectTarget) return;

    try {
      await reject.mutateAsync({
        id: rejectTarget.id,
        reason: rejectReason.trim() || undefined,
      });
      showToast(`${rejectTarget.name} rejected`, "success");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to reject organization",
        "error"
      );
    }
  }

  const organizations = data?.organizations ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(filters.search || filters.isActive !== undefined);

  const pendingOrganizations = pendingData?.organizations ?? [];
  const pendingTotal = pendingData?.total ?? 0;
  const pendingTotalPages = pendingData?.totalPages ?? 1;
  const showPendingSection =
    isPendingLoading || isPendingError || pendingTotal > 0;

  return (
    <>
      {toast ? <Toast toast={toast} onDismiss={dismissToast} /> : null}

      {showPendingSection ? (
        <section className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Awaiting approval
              </h2>
              <p className="text-sm text-text-secondary">
                Self-registered organizations pending your review.
              </p>
            </div>
            {pendingTotal > 0 ? (
              <Badge variant="accent">{pendingTotal} pending</Badge>
            ) : null}
          </div>

          {isPendingLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : null}

          {isPendingError ? (
            <Card className="p-6">
              <p className="text-text-secondary">
                {pendingError instanceof Error
                  ? pendingError.message
                  : "Failed to load pending organizations."}
              </p>
              <Button
                className="mt-4"
                onClick={() => refetchPending()}
                isLoading={isPendingFetching}
              >
                Retry
              </Button>
            </Card>
          ) : null}

          {!isPendingLoading && !isPendingError && pendingData ? (
            pendingOrganizations.length === 0 ? null : (
              <>
                <Card className="overflow-hidden p-0">
                  <TableScrollArea>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Organization</TableHead>
                          <TableHead>Admin</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingOrganizations.map((org) => (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p className="font-medium">
                                  {org.admin?.name ?? "—"}
                                </p>
                                <p className="text-text-secondary">
                                  {org.admin?.email ?? "—"}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-text-secondary">
                              {formatDate(org.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(org)}
                                  isLoading={approve.isPending}
                                  disabled={reject.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectTarget(org);
                                    setRejectReason("");
                                  }}
                                  disabled={approve.isPending || reject.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableScrollArea>
                </Card>

                {pendingTotalPages > 1 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-text-secondary">
                      Page {pendingPage} of {pendingTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingPage <= 1 || isPendingFetching}
                        onClick={() => goToPendingPage(pendingPage - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          pendingPage >= pendingTotalPages || isPendingFetching
                        }
                        onClick={() => goToPendingPage(pendingPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            )
          ) : null}
        </section>
      ) : null}

      <section>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          All organizations
        </h2>

        <Card className="mb-6 p-4 sm:p-6">
          <form
            onSubmit={applyFilters}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="org-search">Search</Label>
              <Input
                id="org-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-status">Status</Label>
              <select
                id="org-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={cn(
                  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                )}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value || "all-statuses"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              {error instanceof Error ? error.message : "Failed to load organizations."}
            </p>
            <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
              Retry
            </Button>
          </Card>
        ) : null}

        {!isLoading && !isError && data ? (
          organizations.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-text-secondary">
                {hasFilters
                  ? "No organizations match your filters."
                  : "No approved organizations yet."}
              </p>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden p-0">
                <TableScrollArea>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizations.map((org) => (
                        <TableRow key={org.id}>
                          <TableCell className="font-medium">{org.name}</TableCell>
                          <TableCell className="text-text-secondary">
                            {org.userCount}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {org.projectCount}
                          </TableCell>
                          <TableCell>
                            <Badge variant={org.isActive ? "success" : "danger"}>
                              {org.isActive ? "Active" : "Suspended"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatDate(org.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              to={`/super-admin/organizations/${org.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              View detail
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableScrollArea>
              </Card>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-text-secondary">
                  {total.toLocaleString()} organization{total === 1 ? "" : "s"} · Page{" "}
                  {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || isFetching}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )
        ) : null}
      </section>

      <Dialog
        open={Boolean(rejectTarget)}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent onClose={() => setRejectTarget(null)}>
          <DialogHeader>
            <DialogTitle>Reject organization</DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `Reject ${rejectTarget.name}? The org admin will be notified by email.`
                : null}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Input
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Optional reason for rejection"
              maxLength={500}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              isLoading={reject.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { SuperAdminLayout } from "@/components/layout/SuperAdminLayout";
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
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    isActive: undefined,
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOrganizations(filters);

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

  const organizations = data?.organizations ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasFilters = Boolean(filters.search || filters.isActive !== undefined);

  return (
    <SuperAdminLayout
      title="Organizations"
      description="Read-only oversight of all organizations on the platform."
    >
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
                : "No organizations registered yet."}
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
    </SuperAdminLayout>
  );
}

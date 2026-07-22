import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useAllUsers } from "@/features/platform/hooks/useAllUsers";
import { useOrganizations } from "@/features/platform/hooks/useOrganizations";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
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

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "super_admin", label: "Super admin" },
  { value: "org_admin", label: "Org admin" },
  { value: "project_manager", label: "Project manager" },
  { value: "team_member", label: "Team member" },
  { value: "client", label: "Client" },
];

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

function roleBadgeVariant(role) {
  switch (role) {
    case "super_admin":
      return "accent";
    case "org_admin":
      return "success";
    case "project_manager":
      return "default";
    default:
      return "muted";
  }
}

export function UsersPage() {
  useDashboardPageMeta({
    title: "Users",
    description: "Cross-organization user search and read-only oversight.",
  });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    role: undefined,
    organizationId: undefined,
  });

  const { data: orgData } = useOrganizations({ page: 1, limit: 100 });
  const { data, isLoading, isError, error, refetch, isFetching } =
    useAllUsers(filters);

  const organizations = orgData?.organizations ?? [];

  function applyFilters(event) {
    event?.preventDefault();
    setPage(1);
    setFilters({
      page: 1,
      limit: 20,
      search: searchInput.trim(),
      role: role || undefined,
      organizationId: organizationId || undefined,
    });
  }

  function clearFilters() {
    setSearchInput("");
    setRole("");
    setOrganizationId("");
    setPage(1);
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      role: undefined,
      organizationId: undefined,
    });
  }

  function goToPage(nextPage) {
    setPage(nextPage);
    setFilters((current) => ({ ...current, page: nextPage }));
  }

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <>
      <Card className="mb-6 p-4 sm:p-6">
        <form
          onSubmit={applyFilters}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <Label htmlFor="user-search">Search</Label>
            <Input
              id="user-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value || "all-roles"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-organization">Organization</Label>
            <select
              id="user-organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
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
            {error instanceof Error ? error.message : "Failed to load users."}
          </p>
          <Button className="mt-4" onClick={() => refetch()} isLoading={isFetching}>
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && data ? (
        users.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No users found</p>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden p-0">
              <TableScrollArea>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="md" />
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.organization ? (
                            <Link
                              to={`/super-admin/organizations/${user.organization.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {user.organization.name}
                            </Link>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "success" : "danger"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-text-secondary">
                          {formatDate(user.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScrollArea>
            </Card>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-text-secondary">
                {total.toLocaleString()} user{total === 1 ? "" : "s"} · Page {page} of{" "}
                {totalPages}
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
    </>
  );
}

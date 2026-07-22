import { useState } from "react";
import { Link } from "react-router-dom";
import { useDashboardPageMeta } from "@/components/layout/dashboardPageMeta";
import { useOrgUsers, useRemoveOrgUser } from "@/features/org/hooks/useOrgUsers";
import { useInvites, useRevokeInvite } from "@/features/invites/hooks/useInvites";
import { InviteMemberDialog } from "@/features/invites/components/InviteMemberDialog";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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

function formatRole(role) {
  return role.replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function roleBadgeVariant(role) {
  switch (role) {
    case "org_admin":
      return "accent";
    case "project_manager":
      return "default";
    case "client":
      return "muted";
    default:
      return "success";
  }
}

export function TeamMembersPage() {
  useDashboardPageMeta({
    title: "Team members",
    description: "Manage users in your organization.",
  });

  const { user: currentUser } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    error: usersFetchError,
    refetch: refetchUsers,
    isFetching: usersFetching,
  } = useOrgUsers();

  const {
    data: invites,
    isLoading: invitesLoading,
    isError: invitesError,
    error: invitesFetchError,
    refetch: refetchInvites,
    isFetching: invitesFetching,
  } = useInvites();

  const revokeInvite = useRevokeInvite();
  const removeUser = useRemoveOrgUser();
  const isLoading = usersLoading || invitesLoading;
  const isError = usersError || invitesError;
  const error = usersFetchError ?? invitesFetchError;

  function handleRetry() {
    refetchUsers();
    refetchInvites();
  }

  async function handleRemoveConfirm() {
    if (!removeTarget) return;
    await removeUser.mutateAsync(removeTarget.id);
    setRemoveTarget(null);
  }

  async function handleRevokeConfirm() {
    if (!revokeTarget) return;
    await revokeInvite.mutateAsync(revokeTarget.id);
    setRevokeTarget(null);
  }

  const isCurrentUser = (memberId) => memberId === currentUser?.id;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          {users?.length ?? 0} member{users?.length === 1 ? "" : "s"}
          {invites?.length
            ? ` · ${invites.length} pending invite${invites.length === 1 ? "" : "s"}`
            : null}
        </p>
        <Button onClick={() => setInviteOpen(true)}>Invite member</Button>
      </div>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : null}

      {isError ? (
        <Card className="p-6">
          <p className="text-text-secondary">
            {error instanceof Error ? error.message : "Failed to load team members."}
          </p>
          <Button
            className="mt-4"
            onClick={handleRetry}
            isLoading={usersFetching || invitesFetching}
          >
            Retry
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && users ? (
        users.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary">No team members yet.</p>
            <Button className="mt-4" onClick={() => setInviteOpen(true)}>
              Invite your first member
            </Button>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <TableScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={member} size="md" />
                          <Link
                            to={`/admin/users/${member.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {member.name}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {formatRole(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? "success" : "danger"}>
                          {member.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(member.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isCurrentUser(member.id) ? (
                          <span className="text-xs text-text-muted">You</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger"
                            onClick={() => setRemoveTarget(member)}
                            isLoading={
                              removeUser.isPending &&
                              removeUser.variables === member.id
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
          </Card>
        )
      ) : null}

      {!isLoading && !isError && invites && invites.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Invitations waiting to be accepted.
          </p>
          <Card className="mt-4 overflow-hidden p-0">
            <TableScrollArea>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(invite.role)}>
                          {formatRole(invite.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {formatDate(invite.expiresAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRevokeTarget(invite)}
                          isLoading={
                            revokeInvite.isPending &&
                            revokeInvite.variables === invite.id
                          }
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableScrollArea>
          </Card>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member"
        description={
          removeTarget
            ? `Remove ${removeTarget.name} from your organization? Their account will be deleted and they will be signed out of all devices.`
            : null
        }
        confirmLabel="Remove member"
        onConfirm={handleRemoveConfirm}
        isLoading={removeUser.isPending}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke invite"
        description={
          revokeTarget
            ? `Revoke the invitation for ${revokeTarget.email}? They will no longer be able to join using this invite link.`
            : null
        }
        confirmLabel="Revoke invite"
        onConfirm={handleRevokeConfirm}
        isLoading={revokeInvite.isPending}
      />
    </>
  );
}

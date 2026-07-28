import { useMemo, useState } from "react";
import { useOrgUsers } from "@/features/org/hooks/useOrgUsers";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Label";

function formatRoleLabel(role) {
  const labels = {
    org_admin: "Organization Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
    client: "Client",
  };
  return labels[role] ?? role?.replaceAll("_", " ") ?? "";
}

export function AddMemberDialog({ open, onOpenChange, project, onAdd, isLoading }) {
  const { data: orgUsers, isLoading: usersLoading } = useOrgUsers();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState("");

  const existingIds = useMemo(() => {
    const ids = new Set([project?.ownerId]);
    for (const member of project?.members ?? []) {
      ids.add(typeof member === "string" ? member : member.id);
    }
    return ids;
  }, [project]);

  const availableUsers = useMemo(
    () => (orgUsers ?? []).filter((user) => !existingIds.has(user.id)),
    [orgUsers, existingIds]
  );

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setSelectedUserId("");
      setError("");
    }
    onOpenChange(nextOpen);
  }

  async function handleAdd() {
    if (!selectedUserId) {
      setError("Select a team member to add.");
      return;
    }

    setError("");
    try {
      await onAdd(selectedUserId);
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Choose someone from your organization to add to this project.
          </DialogDescription>
        </DialogHeader>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="member-select">Team member</Label>
          <select
            id="member-select"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={usersLoading || availableUsers.length === 0}
            className="flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
          >
            <option value="">
              {usersLoading
                ? "Loading users..."
                : availableUsers.length === 0
                  ? "No available users"
                  : "Select a user"}
            </option>
            {availableUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
                {user.role ? ` ${formatRoleLabel(user.role)}` : ""}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button variant="ghost" type="button" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAdd}
            isLoading={isLoading}
            disabled={availableUsers.length === 0}
          >
            Add member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

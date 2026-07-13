import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { useUpdateInvitePolicy } from "@/features/settings/hooks/useOrgSettings";
import { cn } from "@/lib/utils";

const DEFAULT_ROLE_OPTIONS = [
  { value: "project_manager", label: "Project Manager" },
  { value: "team_member", label: "Team Member" },
  { value: "client", label: "Client" },
];

export function MembersRolesSettingsTab({ organization, onSuccess }) {
  const updateInvitePolicy = useUpdateInvitePolicy();

  const [defaultRole, setDefaultRole] = useState("team_member");
  const [inviteExpiryDays, setInviteExpiryDays] = useState(7);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organization) return;
    setDefaultRole(organization.invitePolicy?.defaultRole ?? "team_member");
    setInviteExpiryDays(organization.invitePolicy?.inviteExpiryDays ?? 7);
  }, [organization]);

  async function handleSave() {
    setError("");
    try {
      await updateInvitePolicy.mutateAsync({
        invitePolicy: {
          defaultRole,
          inviteExpiryDays: Number(inviteExpiryDays),
        },
      });
      onSuccess("Invite defaults saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Invite defaults</CardTitle>
        <CardDescription>
          Default role and link expiry for new invitations.
        </CardDescription>
      </CardHeader>

      {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="default-role">Default role</Label>
          <select
            id="default-role"
            value={defaultRole}
            onChange={(e) => setDefaultRole(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            )}
          >
            {DEFAULT_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="invite-expiry">Invite link expiry (days)</Label>
          <Input
            id="invite-expiry"
            type="number"
            min={1}
            max={30}
            value={inviteExpiryDays}
            onChange={(e) => setInviteExpiryDays(e.target.value)}
          />
          <p className="text-xs text-text-muted">
            Stored for future use  not applied to invites yet.
          </p>
        </div>

        <Button onClick={handleSave} isLoading={updateInvitePolicy.isPending}>
          Save invite defaults
        </Button>
      </div>
    </Card>
  );
}

import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { Switch } from "@/components/ui/Switch";
import { useUpdateSecuritySettings } from "@/features/settings/hooks/useOrgSettings";

export function SecuritySettingsTab({ organization, onSuccess }) {
  const updateSecurity = useUpdateSecuritySettings();

  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [require2FA, setRequire2FA] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [twoFaError, setTwoFaError] = useState("");

  useEffect(() => {
    if (!organization) return;
    setPasswordMinLength(organization.security?.passwordMinLength ?? 8);
    setRequire2FA(organization.security?.require2FA ?? false);
  }, [organization]);

  async function savePasswordPolicy() {
    setPasswordError("");
    try {
      await updateSecurity.mutateAsync({
        security: {
          passwordMinLength: Number(passwordMinLength),
          require2FA: organization.security?.require2FA ?? false,
        },
      });
      onSuccess("Password policy saved");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function saveTwoFactor() {
    setTwoFaError("");
    try {
      await updateSecurity.mutateAsync({
        security: {
          passwordMinLength: organization.security?.passwordMinLength ?? 8,
          require2FA,
        },
      });
      onSuccess("Two-factor preference saved");
    } catch (err) {
      setTwoFaError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Password policy</CardTitle>
          <CardDescription>
            Minimum password length for new and updated passwords.
          </CardDescription>
        </CardHeader>

        {passwordError ? <Alert variant="error" className="mb-4">{passwordError}</Alert> : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-min-length">Minimum password length</Label>
            <Input
              id="password-min-length"
              type="number"
              min={6}
              max={32}
              value={passwordMinLength}
              onChange={(e) => setPasswordMinLength(e.target.value)}
            />
            <p className="text-xs text-text-muted">Allowed range: 6–32 characters.</p>
          </div>

          <Button onClick={savePasswordPolicy} isLoading={updateSecurity.isPending}>
            Save password policy
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Two-factor authentication</CardTitle>
          <CardDescription>
            Require 2FA for all organization members.
          </CardDescription>
        </CardHeader>

        {twoFaError ? <Alert variant="error" className="mb-4">{twoFaError}</Alert> : null}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
            <div>
              <p className="text-sm font-medium">Require 2FA</p>
              <p className="mt-1 text-xs text-text-muted">
                Coming soon  preference is saved but not enforced yet.
              </p>
            </div>
            <Switch
              checked={require2FA}
              onCheckedChange={setRequire2FA}
              aria-label="Require two-factor authentication"
            />
          </div>

          <Button onClick={saveTwoFactor} isLoading={updateSecurity.isPending}>
            Save 2FA preference
          </Button>
        </div>
      </Card>
    </div>
  );
}

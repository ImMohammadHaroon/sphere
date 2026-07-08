import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useUpdateGeneralSettings } from "@/features/settings/hooks/useOrgSettings";

function planBadgeVariant(plan) {
  switch (plan) {
    case "enterprise":
      return "success";
    case "pro":
      return "accent";
    default:
      return "muted";
  }
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DetailItem({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <div className="text-sm text-text-primary">{children}</div>
    </div>
  );
}

export function GeneralSettingsTab({ organization, onSuccess }) {
  const updateGeneral = useUpdateGeneralSettings();

  const [name, setName] = useState("");
  const [detailsError, setDetailsError] = useState("");

  useEffect(() => {
    if (!organization) return;
    setName(organization.name ?? "");
  }, [organization]);

  async function saveDetails() {
    setDetailsError("");
    try {
      await updateGeneral.mutateAsync({
        name,
        slug: organization.slug,
        timezone: organization.timezone,
        branding: {
          logoUrl: organization.branding?.logoUrl ?? null,
          primaryColor: organization.branding?.primaryColor ?? "160 56% 28%",
        },
      });
      onSuccess("Organization details saved");
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Organization details</CardTitle>
        <CardDescription>
          Basic information about your organization.
        </CardDescription>
      </CardHeader>

      {detailsError ? <Alert variant="error" className="mb-4">{detailsError}</Alert> : null}

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={planBadgeVariant(organization.plan)}>
            {organization.plan ?? "free"}
          </Badge>
          <Badge variant={organization.isActive ? "success" : "danger"}>
            {organization.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Organization ID">
            <span className="font-mono text-xs sm:text-sm">{organization.id}</span>
          </DetailItem>
          <DetailItem label="Created">
            {formatDate(organization.createdAt)}
          </DetailItem>
          <DetailItem label="Last updated">
            {formatDate(organization.updatedAt)}
          </DetailItem>
        </div>

        <div className="space-y-2">
          <Label htmlFor="org-name">Organization name</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <Button onClick={saveDetails} isLoading={updateGeneral.isPending}>
          Save details
        </Button>
      </div>
    </Card>
  );
}

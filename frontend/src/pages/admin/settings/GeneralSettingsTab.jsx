import { useEffect, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";
import { useUpdateGeneralSettings } from "@/features/settings/hooks/useOrgSettings";
import { cn } from "@/lib/utils";

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export function GeneralSettingsTab({ organization, onSuccess }) {
  const updateGeneral = useUpdateGeneralSettings();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("160 56% 28%");
  const [detailsError, setDetailsError] = useState("");
  const [brandingError, setBrandingError] = useState("");

  useEffect(() => {
    if (!organization) return;
    setName(organization.name ?? "");
    setSlug(organization.slug ?? "");
    setTimezone(organization.timezone ?? "UTC");
    setLogoUrl(organization.branding?.logoUrl ?? "");
    setPrimaryColor(organization.branding?.primaryColor ?? "160 56% 28%");
  }, [organization]);

  async function saveDetails() {
    setDetailsError("");
    try {
      await updateGeneral.mutateAsync({
        name,
        slug,
        timezone,
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

  async function saveBranding() {
    setBrandingError("");
    try {
      await updateGeneral.mutateAsync({
        name: organization.name,
        slug: organization.slug,
        timezone: organization.timezone,
        branding: {
          logoUrl: logoUrl.trim() === "" ? null : logoUrl.trim(),
          primaryColor: primaryColor.trim(),
        },
      });
      onSuccess("Branding saved");
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Organization details</CardTitle>
          <CardDescription>
            Basic information visible across your workspace.
          </CardDescription>
        </CardHeader>

        {detailsError ? <Alert variant="error" className="mb-4">{detailsError}</Alert> : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <p className="text-xs text-text-muted">
              Changing the slug updates your organization&apos;s URL identifier.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-timezone">Timezone</Label>
            <select
              id="org-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              )}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={saveDetails} isLoading={updateGeneral.isPending}>
            Save details
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Branding</CardTitle>
          <CardDescription>
            Logo and accent color for your organization.
          </CardDescription>
        </CardHeader>

        {brandingError ? <Alert variant="error" className="mb-4">{brandingError}</Alert> : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary color</Label>
            <Input
              id="primary-color"
              placeholder="160 56% 28%"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
            <p className="text-xs text-text-muted">
              HSL components matching your theme (e.g.{" "}
              <code className="font-mono">160 56% 28%</code>).
            </p>
          </div>

          <Button onClick={saveBranding} isLoading={updateGeneral.isPending}>
            Save branding
          </Button>
        </div>
      </Card>
    </div>
  );
}

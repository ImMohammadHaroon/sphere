import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useDeleteOrg } from "@/features/settings/hooks/useOrgSettings";
import { ConfirmSlugDialog } from "@/pages/admin/settings/ConfirmSlugDialog";
import { authApi } from "@/lib/authApi";
import { setAccessToken } from "@/lib/apiClient";
import { syncLogout } from "@/lib/authSync";

async function logoutAndRedirect(navigate, query) {
  try {
    await authApi.logout();
  } finally {
    setAccessToken(null);
    syncLogout();
    navigate(`/login?${query}`, { replace: true });
  }
}

export function DangerZoneTab({ organization }) {
  const navigate = useNavigate();
  const deleteOrg = useDeleteOrg();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete(confirmSlug) {
    await deleteOrg.mutateAsync(confirmSlug);
    await logoutAndRedirect(navigate, "deleted=1");
  }

  return (
    <div className="space-y-6">
      <Card className="border-danger/40">
        <CardHeader>
          <CardTitle className="text-lg text-danger">Delete organization</CardTitle>
          <CardDescription>
            Permanently deletes your organization, all users, projects, tasks,
            and audit logs. This action cannot be undone.
          </CardDescription>
        </CardHeader>

        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete organization
        </Button>
      </Card>

      <ConfirmSlugDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete organization permanently"
        description="This will permanently erase all organization data. You will be signed out immediately."
        confirmLabel="Delete organization"
        slug={organization?.slug}
        onConfirm={handleDelete}
        isLoading={deleteOrg.isPending}
        variant="danger"
      />
    </div>
  );
}

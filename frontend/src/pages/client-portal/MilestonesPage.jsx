import { ClientPortalPlaceholder } from "@/components/layout/ClientPortalLayout";

export function ClientMilestonesPage() {
  return (
    <ClientPortalPlaceholder
      title="Milestones"
      description="Review deliverables and approve completed milestones."
    >
      <div className="rounded-lg border border-border bg-surface-raised p-6 shadow-sm">
        <p className="text-sm text-text-secondary">
          Milestone approvals will appear here once connected to the API.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          You will be able to approve milestones from this page.
        </p>
      </div>
    </ClientPortalPlaceholder>
  );
}

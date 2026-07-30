import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

export function MilestoneRejectDialog({
  open,
  onOpenChange,
  milestone,
  onConfirm,
  isLoading = false,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;

    await onConfirm(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Reject milestone</DialogTitle>
            <DialogDescription>
              Reject &quot;{milestone?.name ?? "this milestone"}&quot; and tell
              the team why. This is separate from feedback.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor="milestone-reject-reason">Reject reason</Label>
            <textarea
              id="milestone-reject-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Deliverables don't match the agreed scope..."
              rows={4}
              maxLength={2000}
              disabled={isLoading}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isLoading}
              disabled={!reason.trim()}
            >
              Reject milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

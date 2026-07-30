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

export function MilestoneFeedbackDialog({
  open,
  onOpenChange,
  milestone,
  onSubmit,
  isLoading = false,
}) {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!open) {
      setFeedback("");
    }
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = feedback.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Leave feedback</DialogTitle>
            <DialogDescription>
              Share notes on &quot;{milestone?.name ?? "this milestone"}&quot;.
              Your team will see this — it does not approve or reject the milestone.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor="milestone-feedback">Feedback</Label>
            <textarea
              id="milestone-feedback"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder="Please adjust the header layout on mobile..."
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
            <Button type="submit" isLoading={isLoading}>
              Send feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

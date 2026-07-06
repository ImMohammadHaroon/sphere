import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert } from "@/components/ui/Alert";

export function ConfirmSlugDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  slug,
  onConfirm,
  isLoading,
  variant = "danger",
}) {
  const [confirmSlug, setConfirmSlug] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmSlug("");
      setError("");
    }
  }, [open]);

  const canConfirm = confirmSlug === slug && !isLoading;

  async function handleConfirm() {
    if (!canConfirm) return;

    setError("");

    try {
      await onConfirm(confirmSlug);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className={variant === "danger" ? "text-danger" : undefined}>
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}

        <div className="space-y-2">
          <Label htmlFor="dialog-confirm-slug">
            Type <span className="font-mono font-medium">{slug}</span> to confirm
          </Label>
          <Input
            id="dialog-confirm-slug"
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            placeholder={slug}
            autoComplete="off"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={!canConfirm}
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

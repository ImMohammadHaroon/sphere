import { useEffect, useState } from "react";
import { dateInputToIso, toDateInputValue } from "@/lib/dateFormHelpers";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";

const emptyForm = {
  name: "",
  description: "",
  dueDate: "",
};

export function MilestoneFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  milestone = null,
}) {
  const isEdit = Boolean(milestone);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    if (milestone) {
      setForm({
        name: milestone.name ?? "",
        description: milestone.description ?? "",
        dueDate: toDateInputValue(milestone.dueDate),
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [open, milestone]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setForm(emptyForm);
      setError("");
    }
    onOpenChange(nextOpen);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!form.dueDate) {
      setError("Due date is required.");
      return;
    }

    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        dueDate: dateInputToIso(form.dueDate),
      });
      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save milestone."
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit milestone" : "New milestone"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the milestone details while it is still pending."
              : "Define a deliverable for the client to approve."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="milestone-name">Name</Label>
            <Input
              id="milestone-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Design sign-off"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-description">Description</Label>
            <textarea
              id="milestone-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              placeholder="Optional details"
              className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="milestone-dueDate">Due date</Label>
            <Input
              id="milestone-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => updateField("dueDate", e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isEdit ? "Save changes" : "Create milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

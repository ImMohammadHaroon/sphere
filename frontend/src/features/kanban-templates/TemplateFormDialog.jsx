import { useEffect, useState } from "react";
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
import {
  ColumnsBuilder,
  validateColumnsBuilder,
} from "@/features/kanban-templates/ColumnsBuilder";
import { DEFAULT_BUILDER_COLUMNS } from "@/lib/taskStatusConfig";

function templateToBuilderColumns(templateColumns) {
  return [...templateColumns]
    .sort((a, b) => a.order - b.order)
    .map((col) => ({
      name: col.name,
      color: col.color,
      isDone: col.isDone ?? false,
    }));
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName = "",
  initialColumns = DEFAULT_BUILDER_COLUMNS,
  isSubmitting = false,
  onSubmit,
}) {
  const [name, setName] = useState(initialName);
  const [columns, setColumns] = useState(initialColumns);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setColumns(
      !initialColumns || initialColumns === DEFAULT_BUILDER_COLUMNS
        ? DEFAULT_BUILDER_COLUMNS.map((col) => ({ ...col }))
        : templateToBuilderColumns(initialColumns)
    );
    setError("");
  }, [open, initialName, initialColumns]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Template name is required.");
      return;
    }

    const columnError = validateColumnsBuilder(columns);
    if (columnError) {
      setError(columnError);
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        columns: columns.map((col) => ({
          name: col.name.trim(),
          color: col.color,
          isDone: col.isDone,
        })),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="template-name">Template name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software delivery"
              required
            />
          </div>

          <ColumnsBuilder columns={columns} onChange={setColumns} />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

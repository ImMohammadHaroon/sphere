import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject } from "@/features/projects/hooks/useProjects";
import { useKanbanTemplates } from "@/features/kanban-templates/hooks/useKanbanTemplates";
import {
  ColumnsBuilder,
  validateColumnsBuilder,
} from "@/features/kanban-templates/ColumnsBuilder";
import { dateInputToIso } from "@/lib/dateFormHelpers";
import { DEFAULT_BUILDER_COLUMNS } from "@/lib/taskStatusConfig";
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

const selectClassName =
  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

const emptyForm = {
  name: "",
  description: "",
  startDate: "",
  dueDate: "",
  boardMode: "template",
  kanbanTemplateId: "",
  newTemplateName: "",
};

function emptyBuilderColumns() {
  return DEFAULT_BUILDER_COLUMNS.map((col) => ({ ...col }));
}

export function CreateProjectDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const { data: templates, isLoading: templatesLoading } = useKanbanTemplates();
  const [form, setForm] = useState(emptyForm);
  const [newTemplateColumns, setNewTemplateColumns] = useState(emptyBuilderColumns);
  const [error, setError] = useState("");

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setForm(emptyForm);
      setNewTemplateColumns(emptyBuilderColumns());
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
      setError("Project name is required.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      startDate: dateInputToIso(form.startDate),
      dueDate: dateInputToIso(form.dueDate),
    };

    if (form.boardMode === "template") {
      if (form.kanbanTemplateId) {
        payload.kanbanTemplateId = form.kanbanTemplateId;
      }
    } else if (form.boardMode === "new") {
      if (!form.newTemplateName.trim()) {
        setError("Template name is required for a new board.");
        return;
      }

      const columnError = validateColumnsBuilder(newTemplateColumns);
      if (columnError) {
        setError(columnError);
        return;
      }

      payload.newTemplate = {
        name: form.newTemplateName.trim(),
        columns: newTemplateColumns.map((col) => ({
          name: col.name.trim(),
          color: col.color,
          isDone: col.isDone,
        })),
      };
    }

    try {
      const result = await createProject.mutateAsync(payload);
      handleOpenChange(false);
      navigate(`/dashboard/projects/${result.project._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Set up a new project for your team.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="create-project-name">Name</Label>
            <Input
              id="create-project-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-project-description">Description</Label>
            <textarea
              id="create-project-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-project-start">Start date</Label>
              <Input
                id="create-project-start"
                type="date"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-project-due">Due date</Label>
              <Input
                id="create-project-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField("dueDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <Label>Board setup</Label>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="board-mode"
                  checked={form.boardMode === "template"}
                  onChange={() => updateField("boardMode", "template")}
                />
                Use existing template
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="board-mode"
                  checked={form.boardMode === "new"}
                  onChange={() => updateField("boardMode", "new")}
                />
                Create new template
              </label>
            </div>

            {form.boardMode === "template" ? (
              <div className="space-y-2">
                <Label htmlFor="create-project-template">Template</Label>
                <select
                  id="create-project-template"
                  value={form.kanbanTemplateId}
                  onChange={(e) =>
                    updateField("kanbanTemplateId", e.target.value)
                  }
                  disabled={templatesLoading}
                  className={selectClassName}
                >
                  <option value="">
                    {templatesLoading
                      ? "Loading templates..."
                      : "Default board (if none selected)"}
                  </option>
                  {(templates ?? []).map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-project-template-name">
                    Template name
                  </Label>
                  <Input
                    id="create-project-template-name"
                    value={form.newTemplateName}
                    onChange={(e) =>
                      updateField("newTemplateName", e.target.value)
                    }
                    placeholder="e.g. Product delivery"
                  />
                </div>
                <ColumnsBuilder
                  columns={newTemplateColumns}
                  onChange={setNewTemplateColumns}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createProject.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

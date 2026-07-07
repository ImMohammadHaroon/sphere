import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateProject } from "@/features/projects/hooks/useProjects";
import { dateInputToIso } from "@/lib/dateFormHelpers";
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
  startDate: "",
  dueDate: "",
};

export function CreateProjectDialog({ open, onOpenChange }) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

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
      setError("Project name is required.");
      return;
    }

    try {
      const result = await createProject.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim(),
        startDate: dateInputToIso(form.startDate),
        dueDate: dateInputToIso(form.dueDate),
      });
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

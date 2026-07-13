import { useState } from "react";
import { useCreateTask } from "@/features/tasks/hooks/useCreateTask";
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
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
  title: "",
  description: "",
  assigneeId: "",
  priority: "medium",
  dueDate: "",
};

const selectClassName =
  "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

function formatRoleLabel(role) {
  const labels = {
    org_admin: "Organization Admin",
    project_manager: "Project Manager",
    team_member: "Team Member",
    client: "Client",
  };
  return labels[role] ?? role?.replaceAll("_", " ") ?? "";
}

export function CreateTaskModal({ open, onOpenChange, projectId }) {
  const createTask = useCreateTask(projectId);
  const { data: members, isLoading: membersLoading } = useProjectMembers(
    open ? projectId : undefined
  );
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

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        assigneeId: form.assigneeId || null,
        priority: form.priority,
        dueDate: dateInputToIso(form.dueDate),
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
          <DialogDescription>
            Add a new task to this project.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error ? <Alert variant="error">{error}</Alert> : null}

          <div className="space-y-2">
            <Label htmlFor="create-task-title">Title</Label>
            <Input
              id="create-task-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="Task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-task-description">Description</Label>
            <textarea
              id="create-task-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Optional details"
              rows={3}
              className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-task-assignee">Assignee</Label>
            <select
              id="create-task-assignee"
              value={form.assigneeId}
              onChange={(e) => updateField("assigneeId", e.target.value)}
              disabled={membersLoading}
              className={selectClassName}
            >
              <option value="">
                {membersLoading ? "Loading members..." : "Unassigned"}
              </option>
              {(members ?? []).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                  {member.role ? ` ${formatRoleLabel(member.role)}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-task-priority">Priority</Label>
              <select
                id="create-task-priority"
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                className={selectClassName}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-task-due">Due date</Label>
              <Input
                id="create-task-due"
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
            <Button type="submit" isLoading={createTask.isPending}>
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

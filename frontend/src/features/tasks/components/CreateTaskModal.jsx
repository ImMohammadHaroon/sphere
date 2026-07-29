import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useProject } from "@/features/projects/hooks/useProjects";
import { useCreateTask } from "@/features/tasks/hooks/useCreateTask";
import { useProjectMembers } from "@/features/tasks/hooks/useProjectMembers";
import { useFilePreview } from "@/hooks/useFilePreview";
import { uploadAttachment } from "@/lib/attachmentsApi";
import { dateInputToIso } from "@/lib/dateFormHelpers";
import { formatFileSize, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import {
  DEFAULT_BOARD_COLUMNS,
  getSortedColumns,
  getStatusLabel,
} from "@/lib/taskStatusConfig";
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

const MAX_FILE_SIZE = MAX_ATTACHMENT_SIZE;

function createEmptyForm({ dueDate = "", status = "" } = {}) {
  return {
    title: "",
    description: "",
    assigneeId: "",
    status,
    priority: "medium",
    dueDate,
  };
}

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

export function CreateTaskModal({
  open,
  onOpenChange,
  projectId,
  defaultDueDate = "",
  defaultStatus = "",
}) {
  const createTask = useCreateTask(projectId);
  const { data: project, isLoading: projectLoading } = useProject(
    open ? projectId : undefined
  );
  const { data: members, isLoading: membersLoading } = useProjectMembers(
    open ? projectId : undefined
  );
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(() => createEmptyForm());
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const filePreview = useFilePreview();

  const isSubmitting = createTask.isPending || isUploading;

  const columns = useMemo(() => {
    if (project?.columns?.length) {
      return getSortedColumns(project.columns);
    }
    return DEFAULT_BOARD_COLUMNS;
  }, [project?.columns]);

  const defaultColumnKey = useMemo(() => {
    if (defaultStatus && columns.some((column) => column.key === defaultStatus)) {
      return defaultStatus;
    }
    return columns[0]?.key ?? "";
  }, [columns, defaultStatus]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm((current) => ({
      ...current,
      dueDate: defaultDueDate || current.dueDate,
      status: defaultColumnKey,
    }));
  }, [open, defaultDueDate, defaultColumnKey]);

  function resetForm() {
    setForm(createEmptyForm({ dueDate: defaultDueDate || "", status: defaultColumnKey }));
    setFiles([]);
    setError("");
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileChange(event) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!selected.length) {
      return;
    }

    const oversized = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`"${oversized.name}" is too large. Max size is 5MB.`);
      return;
    }

    setError("");
    setFiles((current) => {
      const existingKeys = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );
      const next = selected.filter(
        (file) =>
          !existingKeys.has(`${file.name}-${file.size}-${file.lastModified}`)
      );
      return [...current, ...next];
    });
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    try {
      const result = await createTask.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim(),
        assigneeId: form.assigneeId || null,
        status: form.status || defaultColumnKey || undefined,
        priority: form.priority,
        dueDate: dateInputToIso(form.dueDate),
      });

      const taskId = result?.task?._id;
      if (taskId && files.length > 0) {
        setIsUploading(true);
        try {
          for (const file of files) {
            await uploadAttachment(taskId, file);
          }
        } catch (uploadErr) {
          setError(
            uploadErr instanceof Error
              ? `Task created, but attachment failed: ${uploadErr.message}`
              : "Task created, but failed to attach file."
          );
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task.");
      setIsUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {defaultDueDate ? "Add to schedule" : "Create task"}
          </DialogTitle>
          <DialogDescription>
            {defaultDueDate
              ? "Schedule a task for the selected day."
              : "Add a new task to this project."}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-task-status">Start in column</Label>
              <select
                id="create-task-status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
                disabled={projectLoading || columns.length === 0}
                className={selectClassName}
              >
                {projectLoading ? (
                  <option value="">Loading board...</option>
                ) : (
                  columns.map((column) => (
                    <option key={column.key} value={column.key}>
                      {getStatusLabel(columns, column.key)}
                    </option>
                  ))
                )}
              </select>
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
                    {member.role ? ` (${formatRoleLabel(member.role)})` : ""}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="space-y-2">
            <Label>Attachments</Label>
            <p className="text-xs text-text-muted">Optional · max 5MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Attach file
            </Button>
            {files.length > 0 ? (
              <ul className="space-y-2 pt-1">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="container-item flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        filePreview.openPreview(file, { type: "local", file })
                      }
                      className="min-w-0 truncate text-left text-primary hover:underline"
                    >
                      {file.name}
                      <span className="ml-2 text-text-muted">
                        {formatFileSize(file.size)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="shrink-0 rounded p-1 text-text-muted hover:bg-card-hover hover:text-text-primary"
                      onClick={() => removeFile(index)}
                      disabled={isSubmitting}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <FilePreviewDialog {...filePreview.dialogProps} />
    </Dialog>
  );
}

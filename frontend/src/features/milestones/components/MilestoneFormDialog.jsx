import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Trash2 } from "lucide-react";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { dateInputToIso, toDateInputValue } from "@/lib/dateFormHelpers";
import { uploadMilestoneAttachment } from "@/lib/milestoneAttachmentsApi";
import { formatFileSize, getFileIcon, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import { useFilePreview } from "@/hooks/useFilePreview";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { MilestoneAttachments } from "@/features/milestones/components/MilestoneAttachments";

const emptyForm = {
  name: "",
  description: "",
  dueDate: "",
};

const MAX_FILE_SIZE = MAX_ATTACHMENT_SIZE;

function PendingFilesField({ files, onAdd, onRemove, onPreview, disabled = false }) {  const fileInputRef = useRef(null);
  const [fileError, setFileError] = useState("");

  function handleFileChange(event) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFileError("");

    if (selected.length === 0) {
      return;
    }

    const valid = [];
    const rejected = [];

    for (const file of selected) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(file.name);
        continue;
      }
      valid.push(file);
    }

    if (rejected.length > 0) {
      setFileError(
        `These files exceed 5MB and were skipped: ${rejected.join(", ")}`
      );
    }

    if (valid.length > 0) {
      onAdd(valid);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>Attachments</Label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="mr-2 h-3.5 w-3.5" />
          Add files
        </Button>
      </div>

      {fileError ? <Alert variant="error">{fileError}</Alert> : null}

      {files.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-text-muted">
          Optional deliverable files (max 5MB each).
        </p>
      ) : (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.type);

            return (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="container-item flex items-center gap-3 rounded-lg border border-border bg-surface-raised/50 px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onPreview(file)}
                    className="truncate text-left text-sm font-medium text-primary hover:underline"
                  >
                    {file.name}
                  </button>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
                  aria-label="Remove file"
                  onClick={() => onRemove(index)}
                  disabled={disabled}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
export function MilestoneFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  milestone = null,
}) {
  const isEdit = Boolean(milestone);
  const [form, setForm] = useState(emptyForm);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const filePreview = useFilePreview();
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
      setPendingFiles([]);
    }
    setError("");
  }, [open, milestone]);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setForm(emptyForm);
      setPendingFiles([]);
      setError("");
    }
    onOpenChange(nextOpen);
  }

  function addPendingFiles(files) {
    setPendingFiles((current) => [...current, ...files]);
  }

  function removePendingFile(index) {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  }

  async function uploadPendingFiles(milestoneId) {
    const results = await Promise.allSettled(
      pendingFiles.map((file) => uploadMilestoneAttachment(milestoneId, file))
    );

    const failed = results.filter((result) => result.status === "rejected");
    queryClient.invalidateQueries({
      queryKey: ["milestone-attachments", milestoneId],
    });

    if (failed.length > 0) {
      throw new Error(
        `Milestone created, but ${failed.length} file(s) failed to upload. You can attach them from the milestone list.`
      );
    }
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
      setIsSubmitting(true);

      const savedMilestone = await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        dueDate: dateInputToIso(form.dueDate),
      });

      if (!isEdit && pendingFiles.length > 0 && savedMilestone?._id) {
        await uploadPendingFiles(savedMilestone._id);
      }

      handleOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save milestone."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const busy = isLoading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClose={() => handleOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit milestone" : "New milestone"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the milestone details and attach deliverable files while it is still pending."
              : "Define a deliverable for the client to approve. Attach files now or add them later."}
          </DialogDescription>        </DialogHeader>

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

          {isEdit && milestone?._id ? (
            <MilestoneAttachments
              milestoneId={milestone._id}
              canUpload
              compact
            />
          ) : (
            <PendingFilesField
              files={pendingFiles}
              onAdd={addPendingFiles}
              onRemove={removePendingFile}
              onPreview={(file) =>
                filePreview.openPreview(file, { type: "local", file })
              }
              disabled={busy}
            />
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={busy}>
              {isEdit ? "Save changes" : "Create milestone"}
            </Button>
          </DialogFooter>        </form>
      </DialogContent>
      <FilePreviewDialog {...filePreview.dialogProps} />
    </Dialog>
  );
}

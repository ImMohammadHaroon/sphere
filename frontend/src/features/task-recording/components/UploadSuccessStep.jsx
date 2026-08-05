import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { attachmentMeta } from "@/lib/fileUtils";
import { getDownloadUrl } from "@/lib/attachmentsApi";
import { toast } from "@/lib/toast";

export function UploadSuccessStep({
  attachment,
  taskId,
  onView,
  onRecordAnother,
}) {
  const meta = attachmentMeta(attachment);
  const downloadUrl = getDownloadUrl(taskId, attachment._id);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      toast.success("Link copied to clipboard.");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-text-primary">
            Recording uploaded
          </p>
          <button
            type="button"
            onClick={onView}
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {meta.fileName}
          </button>
          <p className="text-xs text-text-muted">
            Click the file name or View recording to play it.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onView}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View recording
        </Button>
        <Button type="button" variant="outline" onClick={handleCopyLink}>
          <Copy className="mr-2 h-4 w-4" />
          Copy link
        </Button>
        <Button type="button" variant="ghost" onClick={onRecordAnother}>
          Record another
        </Button>
      </div>
    </div>
  );
}

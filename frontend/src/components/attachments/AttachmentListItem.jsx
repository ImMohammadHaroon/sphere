import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { formatFileSize, getFileIcon } from "@/lib/fileUtils";

export function AttachmentListItem({
  attachment,
  meta,
  isLoading = false,
  onOpen,
  onDelete,
  deleteLoading = false,
  deleteDisabled = false,
  className,
  children,
}) {
  const Icon = getFileIcon(meta.mimeType);

  return (
    <li
      className={cn(
        "container-item flex items-center gap-3 rounded-lg border border-border px-3 py-2",
        isLoading && "border-primary/30 bg-primary/5",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      ) : (
        <Icon className="h-4 w-4 shrink-0 text-text-muted" />
      )}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          disabled={isLoading}
          className={cn(
            "truncate text-left text-sm font-medium hover:underline",
            isLoading ? "cursor-wait text-text-muted" : "text-primary"
          )}
        >
          {isLoading ? "Loading..." : meta.fileName}
        </button>
        <p className="text-xs text-text-muted">
          {formatFileSize(meta.size)}
          {children}
        </p>
      </div>
      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
          aria-label="Delete attachment"
          onClick={onDelete}
          isLoading={deleteLoading}
          disabled={deleteDisabled || isLoading}
        >
          {!deleteLoading ? <Trash2 className="h-4 w-4" /> : null}
        </Button>
      ) : null}
    </li>
  );
}

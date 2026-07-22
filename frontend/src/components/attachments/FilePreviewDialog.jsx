import { useState } from "react";
import { Download, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { formatFileSize, getPreviewKind } from "@/lib/fileUtils";

export function FilePreviewDialog({
  open,
  onOpenChange,
  fileName,
  mimeType,
  size,
  blobUrl,
  textContent,
  isLoading,
  error,
  onDownload,
}) {
  const previewKind = getPreviewKind(mimeType);
  const [previewError, setPreviewError] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPreviewError("");
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="max-w-4xl"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
          <DialogDescription>
            {formatFileSize(size)}
            {mimeType ? ` · ${mimeType}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-[200px]">
          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : null}

          {error ? <Alert variant="error">{error}</Alert> : null}

          {!isLoading && !error ? (
            <>
              {previewKind === "image" && blobUrl && !previewError ? (
                <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                  <img
                    src={blobUrl}
                    alt={fileName}
                    className="max-h-[70vh] w-full object-contain"
                    onError={() =>
                      setPreviewError(
                        "This image could not be rendered. Try downloading it instead."
                      )
                    }
                  />
                </div>
              ) : null}

              {previewError ? <Alert variant="error">{previewError}</Alert> : null}

              {previewKind === "pdf" && blobUrl ? (
                <iframe
                  src={blobUrl}
                  title={fileName}
                  className="h-[70vh] w-full rounded-lg border border-border bg-surface"
                />
              ) : null}

              {previewKind === "text" && textContent !== null ? (
                <pre className="max-h-[70vh] overflow-auto rounded-lg border border-border bg-surface p-4 text-sm text-text-primary whitespace-pre-wrap break-words">
                  {textContent}
                </pre>
              ) : null}

              {previewKind === "video" && blobUrl ? (
                <video
                  src={blobUrl}
                  controls
                  className="max-h-[70vh] w-full rounded-lg border border-border bg-black"
                >
                  <track kind="captions" />
                </video>
              ) : null}

              {previewKind === "audio" && blobUrl ? (
                <div className="rounded-lg border border-border bg-surface p-6">
                  <audio src={blobUrl} controls className="w-full">
                    <track kind="captions" />
                  </audio>
                </div>
              ) : null}

              {previewKind === "none" ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface/50 px-6 py-10 text-center">
                  <File className="h-10 w-10 text-text-muted" />
                  <p className="text-sm text-text-secondary">
                    Preview is not available for this file type. Download it to
                    open on your device.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={onDownload}
            disabled={isLoading || Boolean(error)}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

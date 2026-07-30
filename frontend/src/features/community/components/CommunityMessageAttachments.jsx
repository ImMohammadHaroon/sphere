import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { downloadChatMessageAttachment } from "@/lib/chatAttachmentsApi";
import { attachmentMeta, formatFileSize, getPreviewKind } from "@/lib/fileUtils";
import { cn } from "@/lib/utils";

function ChatImageThumbnail({ roomId, messageId, attachment, onOpen, className }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl = null;
    let cancelled = false;

    async function load() {
      try {
        const blob = await downloadChatMessageAttachment(
          roomId,
          messageId,
          attachment._id
        );
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [roomId, messageId, attachment._id]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex h-40 w-56 items-center justify-center rounded-xl bg-surface-raised text-xs text-text-muted",
          className
        )}
      >
        Could not load image
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={cn(
          "h-40 w-56 animate-pulse rounded-xl bg-surface-raised",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "block overflow-hidden rounded-2xl ring-1 ring-black/[0.06] transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--chat-accent-line)/0.4)]",
        className
      )}
    >
      <img
        src={src}
        alt={attachment.fileName ?? "Image"}
        className="max-h-80 max-w-full object-cover sm:max-w-xs"
      />
    </button>
  );
}

export function CommunityMessageAttachments({
  attachments = [],
  onOpen,
  roomId,
  messageId,
  isOwn = false,
  compact = false,
  outsideBubble = false,
}) {
  if (!attachments.length) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        compact ? "mt-1" : "mt-2",
        outsideBubble && isOwn && "items-end",
        outsideBubble && !isOwn && "items-start"
      )}
    >
      {attachments.map((attachment) => {
        const meta = attachmentMeta(attachment);
        const previewKind = getPreviewKind(meta.mimeType);
        const isImage =
          previewKind === "image" ||
          /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(meta.fileName);

        if (isImage && roomId && messageId) {
          return (
            <ChatImageThumbnail
              key={attachment._id}
              roomId={roomId}
              messageId={messageId}
              attachment={attachment}
              onOpen={() => onOpen(attachment)}
            />
          );
        }

        return (
          <button
            key={attachment._id}
            type="button"
            onClick={() => onOpen(attachment)}
            className={cn(
              "flex max-w-[240px] items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-all hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--chat-accent-line)/0.3)]",
              "border-border/50 bg-white shadow-sm ring-1 ring-black/[0.03]"
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--chat-accent-line)/0.1)]">
              <FileText className="h-4 w-4 text-[hsl(var(--chat-accent-line))]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {meta.fileName}
              </p>
              <p className="text-xs text-text-muted">
                {formatFileSize(meta.size)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function PendingFileChip({ file, previewUrl, onRemove, disabled }) {
  const isImage = file.type?.startsWith("image/");

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-background shadow-sm"
    >
      {isImage && previewUrl ? (
        <div className="h-20 w-20 sm:h-24 sm:w-24">
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-20 w-36 items-center gap-2 px-3 sm:h-24">
          <FileText className="h-4 w-4 shrink-0 text-text-muted" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-text-primary">
              {file.name}
            </p>
            <p className="text-[11px] text-text-muted">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-text-muted shadow-sm transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        aria-label={`Remove ${file.name}`}
      >
        ×
      </button>
    </div>
  );
}

export function MessagesSkeleton() {
  return (
    <div className="space-y-6 px-1">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "flex gap-2",
            index % 2 === 1 && "flex-row-reverse"
          )}
        >
          <div className="h-9 w-9 shrink-0 rounded-full bg-surface-raised animate-pulse" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-surface-raised animate-pulse" />
            <div
              className={cn(
                "rounded-2xl bg-surface-raised animate-pulse",
                index % 2 === 0 ? "h-16 w-64" : "h-12 w-48"
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSpinner() {
  return (
    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

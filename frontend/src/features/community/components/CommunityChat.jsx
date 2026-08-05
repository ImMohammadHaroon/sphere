import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  Paperclip,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { formatFileSize, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useAuth } from "@/hooks/useAuth";
import {
  useCommunityMessages,
  useCreateCommunityMessage,
  useDeleteCommunityMessage,
  useLoadMoreCommunityMessages,
} from "@/features/community/hooks/useCommunityMessages";
import { useCommunitySocket } from "@/features/community/hooks/useCommunitySocket";
import { CommunityMessageItem } from "@/features/community/components/CommunityMessageItem";
import { EmojiPicker } from "@/features/community/components/EmojiPicker";
import {
  ChatSpinner,
  MessagesSkeleton,
  PendingFileChip,
} from "@/features/community/components/CommunityMessageAttachments";
import {
  buildMessageTimeline,
  formatMessageDateLabel,
  getMessageAuthorId,
} from "@/features/community/lib/communityUtils";
import { uploadCommunityMessageAttachment } from "@/lib/communityAttachmentsApi";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 5000;

function DateDivider({ date }) {
  return (
    <div className="relative my-6 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/80" />
      <span
        className="relative rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted shadow-sm"
      >
        {formatMessageDateLabel(date)}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-subtle shadow-lg shadow-primary/10">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary">
        Start the conversation
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-text-muted">
        Share updates, ask questions, or drop files for everyone in your
        organization. Messages appear instantly for the whole team.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted">
        <span className="rounded-full border border-border bg-card px-3 py-1.5">
          Real-time messaging
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1.5">
          Files & images
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1.5">
          Emoji support
        </span>
      </div>
    </div>
  );
}

function PendingFiles({ files, onRemove, disabled }) {
  const previewUrls = useMemo(() => {
    return files.map((file) =>
      file.type?.startsWith("image/") ? URL.createObjectURL(file) : null
    );
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3 pt-1 sm:px-5">
      {files.map((file, index) => (
        <PendingFileChip
          key={`${file.name}-${index}`}
          file={file}
          previewUrl={previewUrls[index]}
          onRemove={() => onRemove(index)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

export function CommunityChat() {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);

  const [body, setBody] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading, isError, error } = useCommunityMessages();
  const createMessage = useCreateCommunityMessage();
  const deleteMessage = useDeleteCommunityMessage();
  const loadMore = useLoadMoreCommunityMessages();
  useCommunitySocket();

  const filePreview = useFilePreview();

  const messages = data?.messages ?? [];
  const hasMore = data?.hasMore ?? false;
  const timeline = useMemo(() => buildMessageTimeline(messages), [messages]);

  const canSend =
    (body.trim().length > 0 || pendingFiles.length > 0) &&
    body.length <= MAX_MESSAGE_LENGTH &&
    !isSending;

  function handleScroll() {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 120;
  }

  useEffect(() => {
    if (!shouldAutoScrollRef.current || loadMore.isPending) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loadMore.isPending]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [body]);

  function handleFileChange(event) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    setFileError("");

    const valid = [];
    const rejected = [];

    for (const file of selected) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        rejected.push(file.name);
        continue;
      }
      valid.push(file);
    }

    if (rejected.length > 0) {
      setFileError(
        `These files exceed ${formatFileSize(MAX_ATTACHMENT_SIZE)} and were skipped: ${rejected.join(", ")}`
      );
    }

    if (valid.length > 0) {
      setPendingFiles((current) => [...current, ...valid]);
    }
  }

  function removePendingFile(index) {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  }

  function handleEmojiSelect(emoji) {
    setBody((current) => current + emoji);
    textareaRef.current?.focus();
  }

  async function handleSend() {
    if (!canSend) return;

    setIsSending(true);
    setFileError("");
    shouldAutoScrollRef.current = true;

    try {
      const result = await createMessage.mutateAsync(body.trim());
      const messageId = result?.message?._id;

      if (messageId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadCommunityMessageAttachment(messageId, file);
        }
      }

      setBody("");
      setPendingFiles([]);
    } catch {
      // Toast handled by mutation
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  async function handleDelete(messageId) {
    setDeletingId(messageId);
    try {
      await deleteMessage.mutateAsync(messageId);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleOpenAttachment(message, attachment) {
    await filePreview.openPreview(attachment, {
      type: "community",
      messageId: message._id,
      attachmentId: attachment._id,
    });
  }

  function handleLoadMore() {
    if (!hasMore || loadMore.isPending || messages.length === 0) return;
    shouldAutoScrollRef.current = false;
    loadMore.mutate(messages[0]._id);
  }

  if (!user?.organizationId) {
    return (
      <Alert variant="info">
        Community chat is available for organization members.
      </Alert>
    );
  }

  return (
    <div
      className="flex h-[calc(100dvh-7.5rem)] min-h-[540px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/[0.06]"
    >
      <div className="relative border-b border-border/80 bg-gradient-to-r from-primary-subtle/60 via-card to-card px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-base font-semibold text-text-primary sm:text-lg">
                  Organization Community
                </h2>
                <p className="text-sm text-text-muted">
                  Everyone in your org is here automatically
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_hsl(var(--primary-subtle))_0%,_transparent_55%)] px-3 py-4 sm:px-5"
      >
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              isLoading={loadMore.isPending}
              className="rounded-full border border-border bg-card/80 shadow-sm"
            >
              Load earlier messages
            </Button>
          </div>
        ) : null}

        {isLoading ? <MessagesSkeleton /> : null}

        {isError ? (
          <Alert variant="danger" className="mx-1">
            {error?.message ?? "Failed to load messages."}
          </Alert>
        ) : null}

        {!isLoading && !isError && messages.length === 0 ? <EmptyState /> : null}

        <div className="mx-auto max-w-3xl">
          {timeline.map((item) => {
            if (item.type === "date") {
              return <DateDivider key={item.key} date={item.date} />;
            }

            return (
              <CommunityMessageItem
                key={item.key}
                message={item.message}
                onDelete={handleDelete}
                onOpenAttachment={handleOpenAttachment}
                deleteLoading={deletingId === item.message._id}
                isFirstInGroup={item.isFirstInGroup}
                isLastInGroup={item.isLastInGroup}
              />
            );
          })}
        </div>
        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="border-t border-border/80 bg-surface-raised/90 backdrop-blur-sm">
        {fileError ? (
          <div className="px-4 pt-3 sm:px-5">
            <Alert variant="danger">{fileError}</Alert>
          </div>
        ) : null}

        <PendingFiles
          files={pendingFiles}
          onRemove={removePendingFile}
          disabled={isSending}
        />

        <div className="p-3 sm:p-4">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-sm transition-shadow focus-within:border-primary/30 focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/10">
            <div className="flex items-end gap-1 sm:gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={isSending}
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-9 shrink-0 rounded-full p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                aria-label="Attach file"
              >
                <Paperclip className="h-5 w-5" />
              </Button>

              <EmojiPicker onSelect={handleEmojiSelect} disabled={isSending} />

              <textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message to your organization..."
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isSending}
                className={cn(
                  "min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-1 py-2.5 text-sm leading-6 text-text-primary placeholder:text-text-muted",
                  "focus-visible:outline-none",
                  isSending && "opacity-60"
                )}
              />

              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl p-0 shadow-sm transition-all",
                  canSend && "shadow-primary/20"
                )}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
              >
                {isSending ? <ChatSpinner /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Press Enter to send, Shift+Enter for a new line
            </span>
            {body.length > 0 ? (
              <span>{body.length}/{MAX_MESSAGE_LENGTH}</span>
            ) : null}
          </div>
        </div>
      </div>

      <FilePreviewDialog {...filePreview.dialogProps} />
    </div>
  );
}

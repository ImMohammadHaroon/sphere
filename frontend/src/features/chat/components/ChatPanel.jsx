import { useEffect, useMemo, useRef, useState } from "react";
import {
  FolderKanban,
  MessageCircle,
  Paperclip,
  Send,
  Users,
} from "lucide-react";
import { formatFileSize, MAX_ATTACHMENT_SIZE } from "@/lib/fileUtils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FilePreviewDialog } from "@/components/attachments/FilePreviewDialog";
import { useFilePreview } from "@/hooks/useFilePreview";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatMessages,
  useCreateChatMessage,
  useDeleteChatMessage,
  useLoadMoreChatMessages,
} from "@/features/chat/hooks/useChatMessages";
import { useChatRealtime } from "@/features/chat/hooks/useChatRealtime";
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
} from "@/features/community/lib/communityUtils";
import { uploadChatMessageAttachment } from "@/lib/chatAttachmentsApi";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_LENGTH = 5000;

const ROOM_ICONS = {
  community: Users,
  project: FolderKanban,
  direct: MessageCircle,
};

function DateDivider({ date }) {
  return (
    <div className="relative my-5 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 h-px bg-border/50" />
      <span
        className="relative rounded-full bg-[hsl(var(--chat-thread))] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
      >
        {formatMessageDateLabel(date)}
      </span>
    </div>
  );
}

function EmptyState({ roomType }) {
  const labels = {
    community: "Say hello to your organization",
    project: "Start chatting with your project team",
    direct: "Send your first direct message",
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--chat-accent-line)/0.12)] text-[hsl(var(--chat-accent-line))]">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="font-display text-base font-semibold text-text-primary">
        {labels[roomType] ?? "No messages yet"}
      </p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
        Messages arrive instantly. Share files, photos, and emojis with your
        team.
      </p>
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

export function ChatPanel({ room }) {
  const { user } = useAuth();
  const roomId = room?._id;
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

  const { data, isLoading, isError, error } = useChatMessages(roomId);
  const createMessage = useCreateChatMessage(roomId);
  const deleteMessage = useDeleteChatMessage(roomId);
  const loadMore = useLoadMoreChatMessages(roomId);
  useChatRealtime(roomId);

  const filePreview = useFilePreview();

  const messages = data?.messages ?? [];
  const hasMore = data?.hasMore ?? false;
  const timeline = useMemo(() => buildMessageTimeline(messages), [messages]);

  const canSend =
    (body.trim().length > 0 || pendingFiles.length > 0) &&
    body.length <= MAX_MESSAGE_LENGTH &&
    !isSending;

  const RoomIcon = ROOM_ICONS[room?.type] ?? MessageCircle;

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
  }, [messages.length, loadMore.isPending, roomId]);

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

  function handleEmojiSelect(emoji) {
    setBody((current) => current + emoji);
    textareaRef.current?.focus();
  }

  async function handleSend() {
    if (!canSend || !roomId) return;

    setIsSending(true);
    setFileError("");
    shouldAutoScrollRef.current = true;

    try {
      const result = await createMessage.mutateAsync(body.trim());
      const messageId = result?.message?._id;

      if (messageId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          await uploadChatMessageAttachment(roomId, messageId, file);
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
      type: "chat",
      roomId,
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
      <Alert variant="info">Chat is available for organization members.</Alert>
    );
  }

  if (!room) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-text-muted">
        Select a conversation to start chatting.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border/40 bg-white/60 px-4 py-3.5 backdrop-blur-sm sm:px-5">
        <div className="flex items-center gap-3">
          {room.type === "direct" && room.otherUser ? (
            <UserAvatar user={room.otherUser} size="md" className="ring-2 ring-white shadow-sm" />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--chat-accent-line)/0.12)] text-[hsl(var(--chat-accent-line))] ring-1 ring-[hsl(var(--chat-accent-line)/0.15)]">
              <RoomIcon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-base font-semibold tracking-tight text-text-primary sm:text-lg">
              {room.name}
            </h2>
            <p className="truncate text-sm text-text-muted">
              {room.subtitle ?? "Real-time chat"}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto bg-[hsl(var(--chat-thread))] px-1.5 py-3 sm:px-3"
      >
        {hasMore ? (
          <div className="mb-4 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLoadMore}
              isLoading={loadMore.isPending}
              className="rounded-full border border-border/50 bg-white/80 text-text-secondary shadow-sm hover:bg-white"
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

        {!isLoading && !isError && messages.length === 0 ? (
          <EmptyState roomType={room.type} />
        ) : null}

        <div className="w-full">
          {timeline.map((item) => {
            if (item.type === "date") {
              return <DateDivider key={item.key} date={item.date} />;
            }

            return (
              <CommunityMessageItem
                key={item.key}
                roomId={roomId}
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

      <div className="border-t border-border/40 bg-white/80 p-3 backdrop-blur-md sm:p-4">
        {fileError ? (
          <div className="mb-3">
            <Alert variant="danger">{fileError}</Alert>
          </div>
        ) : null}

        <PendingFiles
          files={pendingFiles}
          onRemove={(index) =>
            setPendingFiles((current) => current.filter((_, i) => i !== index))
          }
          disabled={isSending}
        />

        <div className="rounded-2xl border border-border/50 bg-[hsl(var(--chat-input))] p-1.5 shadow-[0_4px_24px_-4px_rgba(15,45,30,0.12)] ring-1 ring-black/[0.03] transition-shadow focus-within:ring-[hsl(var(--chat-accent-line)/0.25)]">
          <div className="flex items-end gap-0.5 sm:gap-1">
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
                className="h-9 w-9 shrink-0 rounded-xl p-0 text-text-muted hover:bg-[hsl(var(--chat-accent-line)/0.08)] hover:text-[hsl(var(--chat-accent-line))]"
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
                placeholder="Write a message..."
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isSending}
                className={cn(
                  "min-h-[44px] max-h-32 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 text-text-primary placeholder:text-text-muted/70 focus-visible:outline-none",
                  isSending && "opacity-60"
                )}
              />

              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl p-0 transition-all",
                  canSend
                    ? "bg-gradient-to-br from-[hsl(var(--chat-bubble-own))] to-[hsl(var(--chat-bubble-own-deep))] text-white shadow-md shadow-[hsl(var(--chat-bubble-own-deep)/0.35)] hover:opacity-95"
                    : "bg-surface-raised text-text-muted"
                )}
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
              >
                {isSending ? <ChatSpinner /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
      </div>

      <FilePreviewDialog {...filePreview.dialogProps} />
    </div>
  );
}

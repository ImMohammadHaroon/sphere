import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { CommunityMessageAttachments } from "@/features/community/components/CommunityMessageAttachments";
import {
  formatRoleLabel,
  getRoleBadgeClass,
  isMessageFromUser,
} from "@/features/community/lib/communityUtils";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export function CommunityMessageItem({
  message,
  roomId,
  onDelete,
  onOpenAttachment,
  deleteLoading = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  className,
}) {
  const { user } = useAuth();
  const author = message.author;
  const isOwn = isMessageFromUser(message, user);
  const canDelete =
    isOwn ||
    user?.role === "org_admin" ||
    user?.role === "project_manager";

  const hasBody = Boolean(message.body?.trim());
  const hasAttachments = message.attachments?.length > 0;

  return (
    <div
      className={cn(
        "group flex w-full gap-2 sm:gap-2.5",
        isOwn && "flex-row-reverse",
        !isLastInGroup && "mb-0.5",
        isLastInGroup && "mb-3",
        className
      )}
    >
      <div className="w-8 shrink-0 sm:w-9">
        {isFirstInGroup ? (
          <UserAvatar
            user={author}
            size="md"
            className="ring-2 ring-[hsl(var(--chat-thread))] shadow-sm"
          />
        ) : null}
      </div>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {isFirstInGroup ? (
          <div
            className={cn(
              "mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-0.5",
              isOwn && "justify-end"
            )}
          >
            {!isOwn ? (
              <span className="text-sm font-semibold text-text-primary">
                {author?.name ?? "Unknown"}
              </span>
            ) : (
              <span className="text-sm font-semibold text-[hsl(var(--chat-accent-line))]">
                You
              </span>
            )}
            {author?.role && !isOwn ? (
              <span
                className={cn(
                  "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  getRoleBadgeClass(author.role)
                )}
              >
                {formatRoleLabel(author.role)}
              </span>
            ) : null}
            <span className="text-[11px] text-text-muted/80">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        ) : null}

        {hasBody ? (
          <div
            className={cn(
              "relative max-w-[88%] px-3.5 py-2.5 sm:max-w-[min(88%,26rem)]",
              isOwn
                ? "rounded-[20px] rounded-br-md bg-gradient-to-br from-[hsl(var(--chat-bubble-own))] to-[hsl(var(--chat-bubble-own-deep))] text-white shadow-md shadow-[hsl(var(--chat-bubble-own-deep)/0.25)]"
                : "rounded-[20px] rounded-bl-md border border-border/40 bg-white text-text-primary shadow-sm ring-1 ring-black/[0.03]"
            )}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.body}
            </p>

            {canDelete && !hasAttachments ? (
              <DeleteButton
                isOwn={isOwn}
                onDelete={() => onDelete(message._id)}
                deleteLoading={deleteLoading}
              />
            ) : null}
          </div>
        ) : null}

        {hasAttachments ? (
          <div className="relative max-w-[88%] sm:max-w-[min(88%,26rem)]">
            <CommunityMessageAttachments
              attachments={message.attachments}
              roomId={roomId}
              messageId={message._id}
              onOpen={(attachment) => onOpenAttachment(message, attachment)}
              isOwn={isOwn}
              compact={hasBody}
              outsideBubble
            />
            {canDelete ? (
              <DeleteButton
                isOwn={isOwn}
                onDelete={() => onDelete(message._id)}
                deleteLoading={deleteLoading}
                floating
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DeleteButton({ isOwn, onDelete, deleteLoading, floating = false }) {
  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={deleteLoading}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-white text-text-muted shadow-sm transition-all hover:border-danger/30 hover:bg-danger/5 hover:text-danger",
        floating &&
          cn(
            "absolute -top-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            isOwn ? "-left-2" : "-right-2",
            deleteLoading && "opacity-100"
          ),
        !floating &&
          cn(
            "absolute -top-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            isOwn ? "-left-2" : "-right-2",
            deleteLoading && "opacity-100"
          )
      )}
      aria-label="Delete message"
    >
      {deleteLoading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

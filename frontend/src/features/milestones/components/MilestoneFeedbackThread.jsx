import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useReplyMilestoneFeedback } from "@/features/milestones/hooks/useMilestones";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";

function formatMessageTime(value) {
  if (!value) return "";
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

function messageAuthorLabel(message) {
  if (message.author?.name) {
    return message.author.name;
  }
  return message.author?.role === "client" || !message.author ? "Client" : "Team";
}

function isClientMessage(message) {
  return !message.author || message.author.role === "client";
}

function normalizeMessages(messages, clientFeedback) {
  if (messages?.length) {
    return messages;
  }

  if (clientFeedback?.trim()) {
    return [
      {
        _id: "legacy",
        body: clientFeedback,
        author: null,
        createdAt: null,
      },
    ];
  }

  return [];
}

export function MilestoneFeedbackThread({
  milestoneId,
  messages = [],
  clientFeedback = "",
  canReply = false,
  compact = false,
  className = "",
}) {
  const replyFeedback = useReplyMilestoneFeedback();
  const [reply, setReply] = useState("");
  const thread = normalizeMessages(messages, clientFeedback);
  const hasClientFeedback = thread.some(isClientMessage);

  async function handleReplySubmit(event) {
    event.preventDefault();
    const trimmed = reply.trim();
    if (!trimmed) return;

    await replyFeedback.mutateAsync({
      id: milestoneId,
      message: trimmed,
    });
    setReply("");
  }

  if (!thread.length) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-medium text-text-muted">Feedback conversation</p>

      <ul
        className={cn(
          "space-y-2",
          compact && "max-h-48 overflow-y-auto pr-1"
        )}
      >
        {thread.map((message) => {
          const fromClient = isClientMessage(message);

          return (
            <li
              key={message._id}
              className={cn(
                "rounded-lg border px-3 py-2",
                fromClient
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-primary/15 bg-primary/5"
              )}
            >
              <div className="flex items-center gap-2">
                <UserAvatar user={message.author} size="xs" />
                <span className="text-xs font-medium text-text-primary">
                  {messageAuthorLabel(message)}
                </span>
                <span className="text-xs text-text-muted">
                  {fromClient ? "Client" : "Team"}
                </span>
                {message.createdAt ? (
                  <span className="ml-auto text-xs text-text-muted">
                    {formatMessageTime(message.createdAt)}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-secondary">
                {message.body}
              </p>
            </li>
          );
        })}
      </ul>

      {canReply && hasClientFeedback ? (
        <form
          onSubmit={handleReplySubmit}
          className="space-y-2 rounded-lg border border-border bg-surface-raised/40 p-3"
        >
          <Label htmlFor={`reply-${milestoneId}`}>Your reply</Label>
          <textarea
            id={`reply-${milestoneId}`}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Thanks for the note — we'll update the mobile header spacing."
            rows={3}
            maxLength={2000}
            disabled={replyFeedback.isPending}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button
            type="submit"
            size="sm"
            isLoading={replyFeedback.isPending}
            disabled={!reply.trim()}
          >
            Send reply
          </Button>
        </form>
      ) : null}
    </div>
  );
}

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/useAuth";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "@/features/tasks/hooks/useComments";
import { useTaskCollaborationSocket } from "@/features/tasks/hooks/useTaskCollaborationSocket";

const MAX_COMMENT_LENGTH = 5000;

function memberInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CommentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function TaskComments({ taskId, projectId }) {
  const { user } = useAuth();
  const role = user?.role ?? "";
  const isClient = role === "client";
  const isElevated = role === "org_admin" || role === "project_manager";

  useTaskCollaborationSocket(projectId, taskId);

  const { data: comments = [], isLoading, isError, error } = useComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");

  function canDeleteComment(comment) {
    if (isElevated) return true;
    return comment.authorId === user?.id || comment.author?.id === user?.id;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const trimmed = body.trim();
    if (!trimmed) {
      setFormError("Comment cannot be empty.");
      return;
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setFormError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters.`);
      return;
    }

    try {
      await createComment.mutateAsync(trimmed);
      setBody("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to post comment.");
    }
  }

  async function handleDelete(commentId) {
    try {
      await deleteComment.mutateAsync(commentId);
    } catch {
      // mutation error surfaces via deleteComment state if needed
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-text-primary">Comments</h3>
        <p className="text-sm text-text-secondary">
          Discuss progress and share updates on this task.
        </p>
      </div>

      {isLoading ? <CommentsSkeleton /> : null}

      {isError ? (
        <Alert variant="error">
          {error instanceof Error ? error.message : "Failed to load comments."}
        </Alert>
      ) : null}

      {!isLoading && !isError ? (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-text-muted">
              No comments yet.
              {!isClient ? " Be the first to add one." : ""}
            </p>
          ) : (
            <ul className="space-y-4">
              {comments.map((comment) => (
                <li
                  key={comment._id}
                  className="flex gap-3 rounded-lg border border-border bg-surface-raised/50 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-sm font-medium text-primary">
                    {memberInitials(comment.author?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-text-primary">
                        {comment.author?.name ?? "Unknown"}
                      </span>
                      <span className="text-xs text-text-muted">
                        {comment.createdAt
                          ? formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })
                          : ""}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-text-secondary">
                      {comment.body}
                    </p>
                  </div>
                  {canDeleteComment(comment) ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-text-muted hover:text-danger"
                      aria-label="Delete comment"
                      onClick={() => handleDelete(comment._id)}
                      isLoading={deleteComment.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {!isClient ? (
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-border pt-4">
              <Label htmlFor={`comment-${taskId}`}>Add a comment</Label>
              <textarea
                id={`comment-${taskId}`}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                maxLength={MAX_COMMENT_LENGTH}
                placeholder="Write a comment…"
                className="flex w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              />
              {formError ? <Alert variant="error">{formError}</Alert> : null}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={createComment.isPending}
                  disabled={!body.trim()}
                >
                  Post comment
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

import { parseCommentBody } from "@/features/tasks/utils/mentionUtils";

export function CommentBody({ body, className }) {
  const parts = parseCommentBody(body);

  if (parts.length === 0) {
    return null;
  }

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (part.type === "mention") {
          return (
            <span
              key={`${part.userId}-${index}`}
              className="font-medium text-dashboard-accent"
            >
              @{part.name}
            </span>
          );
        }

        return <span key={`text-${index}`}>{part.value}</span>;
      })}
    </p>
  );
}

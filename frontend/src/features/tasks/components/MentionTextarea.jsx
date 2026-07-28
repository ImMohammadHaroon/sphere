import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import {
  filterMentionCandidates,
  getMentionQuery,
  insertMention,
} from "@/features/tasks/utils/mentionUtils";

export function MentionTextarea({
  id,
  value,
  onChange,
  members = [],
  currentUserId,
  rows = 3,
  maxLength,
  placeholder,
  disabled = false,
  autoFocus = false,
  className,
}) {
  const textareaRef = useRef(null);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const candidates = mentionQuery
    ? filterMentionCandidates(members, mentionQuery.query, currentUserId)
    : [];

  useEffect(() => {
    setActiveIndex(0);
  }, [mentionQuery?.query, candidates.length]);

  function updateMentionState(nextValue, cursor) {
    setMentionQuery(getMentionQuery(nextValue, cursor));
  }

  function handleChange(event) {
    const nextValue = event.target.value;
    onChange(nextValue);
    updateMentionState(nextValue, event.target.selectionStart);
  }

  function handleSelect(event) {
    updateMentionState(event.target.value, event.target.selectionStart);
  }

  function applyMention(member) {
    const textarea = textareaRef.current;
    if (!textarea || !mentionQuery) {
      return;
    }

    const { value: nextValue, cursor } = insertMention({
      value,
      mentionQuery,
      cursor: textarea.selectionStart,
      member,
    });

    onChange(nextValue);
    setMentionQuery(null);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function handleKeyDown(event) {
    if (!mentionQuery || candidates.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % candidates.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + candidates.length) % candidates.length
      );
      return;
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      applyMention(candidates[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setMentionQuery(null);
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
      />

      {mentionQuery && candidates.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <p className="border-b border-border px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            Mention teammate
          </p>
          <ul className="max-h-56 overflow-y-auto py-1">
            {candidates.map((member, index) => (
              <li key={member.id}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyMention(member)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                    index === activeIndex
                      ? "bg-dashboard-accent-subtle text-text-primary"
                      : "text-text-secondary hover:bg-surface-raised"
                  )}
                >
                  <UserAvatar user={member} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-text-primary">
                      {member.name}
                    </span>
                    {member.email ? (
                      <span className="block truncate text-xs text-text-muted">
                        {member.email}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

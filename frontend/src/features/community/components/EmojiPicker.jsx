import { useRef, useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const EMOJI_GROUPS = [
  ["😀", "😂", "😊", "😍", "🥳", "😎", "🤔", "😅"],
  ["👍", "👎", "👏", "🙌", "💪", "🤝", "✌️", "🙏"],
  ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💯"],
  ["🔥", "⭐", "✨", "🎉", "🎊", "🏆", "💡", "📌"],
  ["✅", "❌", "⚠️", "📎", "📁", "📷", "🎵", "💬"],
];

export function EmojiPicker({ onSelect, className, disabled = false }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  function handleSelect(emoji) {
    onSelect(emoji);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={disabled}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl text-text-muted transition-all",
          "hover:bg-[hsl(var(--chat-accent-line)/0.1)] hover:text-[hsl(var(--chat-accent-line))]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--chat-accent-line)/0.25)]",
          disabled && "opacity-50"
        )}
        aria-label="Add emoji"
        aria-expanded={open}
      >
        <Smile className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
            aria-label="Close emoji picker"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute bottom-full left-0 z-50 mb-3 w-72 rounded-2xl border border-border/40 bg-white p-3 shadow-xl shadow-black/10 ring-1 ring-black/[0.04]"
          >
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Pick an emoji
            </p>
            <div className="space-y-1.5">
              {EMOJI_GROUPS.map((group, index) => (
                <div key={index} className="flex flex-wrap gap-0.5">
                  {group.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all hover:bg-[hsl(var(--chat-accent-line)/0.1)] hover:scale-110 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

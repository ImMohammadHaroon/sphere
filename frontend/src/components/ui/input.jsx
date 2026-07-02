import { cn } from "@/lib/utils";

export function Input({ className, error, ...props }) {
  return (
    <div className="space-y-1">
      <input
        className={cn(
          "flex h-10 w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
          error && "border-danger",
          className
        )}
        {...props}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

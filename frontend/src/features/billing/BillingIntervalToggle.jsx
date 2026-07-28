import { cn } from "@/lib/utils";

export function BillingIntervalToggle({ interval, onChange, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("month")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          interval === "month"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("year")}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          interval === "year"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-text-secondary hover:text-text-primary"
        )}
      >
        Yearly
        <span className="ml-1.5 text-xs opacity-80">Save 17%</span>
      </button>
    </div>
  );
}

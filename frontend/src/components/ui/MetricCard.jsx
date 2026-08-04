import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

function formatMetricValue(value) {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return value;
}

const variantValueClasses = {
  default: "text-dashboard-accent",
  primary: "text-primary",
  danger: "text-danger",
  success: "text-success",
};

export const METRIC_TONE_STYLES = {
  emerald: {
    bg: "bg-primary/10",
    text: "text-primary",
    button:
      "border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover",
  },
  blue: {
    bg: "bg-info/10",
    text: "text-info",
    button: "border-0 bg-info text-white shadow-sm hover:opacity-90",
  },
  amber: {
    bg: "bg-[hsl(var(--kanban-amber))]/10",
    text: "text-[hsl(var(--kanban-amber))]",
    button:
      "border-0 bg-[hsl(var(--kanban-amber))] text-white shadow-sm hover:opacity-90",
  },
  orange: {
    bg: "bg-[hsl(var(--kanban-orange))]/10",
    text: "text-[hsl(var(--kanban-orange))]",
    button:
      "border-0 bg-[hsl(var(--kanban-orange))] text-white shadow-sm hover:opacity-90",
  },
  violet: {
    bg: "bg-[hsl(var(--kanban-purple))]/10",
    text: "text-[hsl(var(--kanban-purple))]",
    button:
      "border-0 bg-[hsl(var(--kanban-purple))] text-white shadow-sm hover:opacity-90",
  },
  rose: {
    bg: "bg-danger/10",
    text: "text-danger",
    button: "border-0 bg-danger text-white shadow-sm hover:opacity-90",
  },
  slate: {
    bg: "bg-[hsl(var(--kanban-gray))]/10",
    text: "text-[hsl(var(--kanban-gray))]",
    button:
      "border-0 bg-[hsl(var(--kanban-gray))] text-white shadow-sm hover:opacity-90",
  },
  teal: {
    bg: "bg-[hsl(var(--kanban-progress))]/10",
    text: "text-[hsl(var(--kanban-progress))]",
    button:
      "border-0 bg-[hsl(var(--kanban-progress))] text-white shadow-sm hover:opacity-90",
  },
};

export function getMetricToneButtonClass(tone) {
  return METRIC_TONE_STYLES[tone]?.button ?? "";
}

export function MetricCard({
  label,
  value,
  hint,
  variant = "default",
  tone,
  onClick,
  interactive,
  className,
  "aria-label": ariaLabel,
}) {
  const isInteractive = interactive ?? !!onClick;
  const toneStyles = tone ? METRIC_TONE_STYLES[tone] : null;

  return (
    <Card
      className={cn(
        toneStyles?.bg ?? "bg-dashboard-accent-subtle",
        "p-5",
        isInteractive &&
          "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        className
      )}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      aria-label={ariaLabel ?? (isInteractive ? `View details for ${label}` : undefined)}
      onClick={onClick}
      onKeyDown={
        isInteractive
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.(event);
              }
            }
          : undefined
      }
    >
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-semibold sm:text-3xl",
          toneStyles?.text ??
            variantValueClasses[variant] ??
            variantValueClasses.default
        )}
      >
        {formatMetricValue(value)}
      </p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </Card>
  );
}

function formatPercent(rate) {
  if (rate == null || Number.isNaN(Number(rate))) {
    return "—";
  }
  return `${Math.round(Number(rate) * 100)}%`;
}

export function PercentMetricCard({
  label,
  value,
  tone,
  onClick,
  interactive,
  className,
}) {
  return (
    <MetricCard
      label={label}
      value={formatPercent(value)}
      variant="primary"
      tone={tone}
      onClick={onClick}
      interactive={interactive}
      className={className}
    />
  );
}

export function HintMetricCard({
  label,
  value,
  hint,
  tone,
  onClick,
  interactive,
  className,
}) {
  return (
    <MetricCard
      label={label}
      value={typeof value === "number" ? value : Number(value)}
      hint={hint}
      variant="primary"
      tone={tone}
      onClick={onClick}
      interactive={interactive}
      className={className}
    />
  );
}

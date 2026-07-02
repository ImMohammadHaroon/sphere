import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const accentStyles = {
  primary: "border-primary/20 hover:border-primary/40 hover:bg-primary-subtle",
  accent: "border-accent/30 hover:border-accent/50 hover:bg-accent-subtle",
  neutral: "border-border hover:border-border-strong hover:bg-surface",
};

const badgeStyles = {
  primary: "bg-primary-subtle text-primary",
  accent: "bg-accent-subtle text-accent-foreground",
  neutral: "bg-surface text-text-secondary",
};

export function NavCard({
  title,
  description,
  to,
  badge,
  accent = "neutral",
  className,
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col rounded-lg border bg-surface-raised p-5 shadow-sm transition-all",
        accentStyles[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge ? (
            <span
              className={cn(
                "mb-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                badgeStyles[accent]
              )}
            >
              {badge}
            </span>
          ) : null}
          <h3 className="font-display text-lg font-semibold text-text-primary">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {description}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}

import { BillingIntervalToggle } from "@/features/billing/BillingIntervalToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/features/landing/pricingData";
import { Check, Users, FolderKanban } from "lucide-react";

function PlanCard({
  plan,
  interval,
  isCurrent,
  onSelect,
  isLoading,
}) {
  const priceCents =
    interval === "year" ? plan.yearlyPriceCents : plan.monthlyPriceCents;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-xl border p-5 transition-shadow",
        plan.highlighted
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-primary/20",
        isCurrent && "ring-2 ring-primary/40"
      )}
    >
      {plan.highlighted && !isCurrent ? (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
          Popular
        </span>
      ) : null}

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-text-primary">{plan.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">{plan.description}</p>
        </div>
        {isCurrent ? <Badge variant="success">Current</Badge> : null}
      </div>

      <p className="mt-4 font-landing-display text-3xl font-semibold">
        {formatPrice(priceCents)}
        <span className="text-sm font-normal text-text-muted">
          /{interval === "year" ? "yr" : "mo"}
        </span>
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
          <Users className="h-3 w-3" />
          {plan.maxUsers} users
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
          <FolderKanban className="h-3 w-3" />
          {plan.maxProjects} projects
        </span>
      </div>

      <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-5 w-full"
        variant={isCurrent ? "outline" : "primary"}
        disabled={isCurrent || isLoading}
        onClick={() => onSelect(plan.id)}
      >
        {isCurrent ? "Current plan" : `Switch to ${plan.name}`}
      </Button>
    </article>
  );
}

export function PlanSelector({
  plans,
  currentPlan,
  interval,
  onIntervalChange,
  onSelectPlan,
  isLoading,
  compact = false,
}) {
  return (
    <div className={cn("space-y-5", compact ? "pt-1" : "space-y-6")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {!compact ? (
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Plans</h3>
            <p className="text-sm text-text-secondary">
              All plans include a 14-day free trial. Switch anytime.
            </p>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            Toggle monthly or yearly billing, then pick a plan.
          </p>
        )}
        <BillingIntervalToggle interval={interval} onChange={onIntervalChange} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrent={plan.id === currentPlan}
            onSelect={onSelectPlan}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}

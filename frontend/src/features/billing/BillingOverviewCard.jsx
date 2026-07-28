import {
  Calendar,
  CreditCard,
  MoreHorizontal,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPrice } from "@/features/landing/pricingData";
import {
  formatBillingDate,
  formatBillingInterval,
  formatPlanLabel,
  formatSubscriptionStatus,
} from "./billingFormatters";
import { cn } from "@/lib/utils";

function capitalize(value) {
  if (!value) return "Card";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusVariant(status) {
  switch (status) {
    case "active":
    case "paid":
      return "success";
    case "trialing":
      return "info";
    case "past_due":
    case "open":
      return "warning";
    case "canceled":
      return "danger";
    default:
      return "muted";
  }
}

function TrialProgress({ daysLeft, trialEndsAt }) {
  const trialLength = 14;
  const elapsed = Math.max(0, trialLength - (daysLeft ?? 0));
  const percent = Math.min(100, Math.round((elapsed / trialLength) * 100));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Trial progress</span>
        <span>{daysLeft} days remaining</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      {trialEndsAt ? (
        <p className="mt-2 text-xs text-text-muted">
          Trial ends {formatBillingDate(trialEndsAt)}
        </p>
      ) : null}
    </div>
  );
}

export function BillingOverviewCard({
  billing,
  paymentMethods = [],
  currentPlanDetails,
  onChangePlan,
  onManagePayment,
  onCancel,
  onReactivate,
  isReactivating,
}) {
  const priceCents =
    billing.interval === "year"
      ? currentPlanDetails?.yearlyPriceCents
      : currentPlanDetails?.monthlyPriceCents;

  const priceLabel = priceCents
    ? `${formatPrice(priceCents)}/${billing.interval === "year" ? "yr" : "mo"}`
    : null;

  const defaultCard =
    paymentMethods.find((method) => method.isDefault) ?? paymentMethods[0] ?? null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-gradient-to-br from-primary/10 via-surface to-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                Current plan
              </p>
              <h3 className="text-xl font-semibold text-text-primary">
                {formatPlanLabel(billing.plan)}
              </h3>
            </div>
          </div>
          <Badge variant={statusVariant(billing.status)}>
            {formatSubscriptionStatus(billing.status)}
          </Badge>
        </div>

        {priceLabel ? (
          <p className="mt-4 font-landing-display text-3xl font-semibold text-text-primary">
            {priceLabel}
          </p>
        ) : null}

        <p className="mt-1 text-sm text-text-secondary">
          Billed {formatBillingInterval(billing.interval).toLowerCase()}
          {billing.cancelAtPeriodEnd
            ? " · Cancels at period end"
            : billing.currentPeriodEnd
              ? ` · Renews ${formatBillingDate(billing.currentPeriodEnd)}`
              : null}
        </p>

        {billing.status === "trialing" && billing.daysLeftInTrial !== null ? (
          <TrialProgress
            daysLeft={billing.daysLeftInTrial}
            trialEndsAt={billing.trialEndsAt}
          />
        ) : null}
      </div>

      <div className="grid gap-3 border-t border-border p-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/80 px-3 py-2.5">
          <CreditCard className="h-4 w-4 text-text-muted" />
          <div className="min-w-0">
            <p className="text-xs text-text-muted">Payment</p>
            <p className="truncate text-sm font-medium text-text-primary">
              {defaultCard
                ? `${capitalize(defaultCard.brand)} ···· ${defaultCard.last4}`
                : "No card on file"}
            </p>
            {paymentMethods.length > 1 ? (
              <p className="text-xs text-text-muted">
                {paymentMethods.length} cards saved
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/80 px-3 py-2.5">
          <Calendar className="h-4 w-4 text-text-muted" />
          <div>
            <p className="text-xs text-text-muted">Next event</p>
            <p className="text-sm font-medium text-text-primary">
              {billing.cancelAtPeriodEnd
                ? `Access until ${formatBillingDate(billing.currentPeriodEnd)}`
                : billing.status === "trialing" && billing.trialEndsAt
                  ? `Billing starts ${formatBillingDate(billing.trialEndsAt)}`
                  : billing.currentPeriodEnd
                    ? `Renews ${formatBillingDate(billing.currentPeriodEnd)}`
                    : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border bg-surface/50 px-4 py-3">
        <Button size="sm" onClick={onChangePlan}>
          Change plan
        </Button>
        <Button size="sm" variant="outline" onClick={onManagePayment}>
          {paymentMethods.length > 0 ? "Manage cards" : "Add card"}
        </Button>
        {billing.cancelAtPeriodEnd ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onReactivate}
            isLoading={isReactivating}
          >
            Reactivate
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className={cn("text-text-muted hover:text-danger")}
            onClick={onCancel}
            disabled={billing.status === "canceled"}
          >
            <MoreHorizontal className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

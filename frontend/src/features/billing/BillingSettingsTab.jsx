import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  useSubscription,
  useChangePlan,
  useCancelSubscription,
  useReactivateSubscription,
  useInvoices,
} from "./hooks/useBilling";
import { UsageLimitsCard } from "./UsageLimitsCard";
import { PaymentMethodCard } from "./PaymentMethodCard";
import { OrderHistoryCard } from "./OrderHistoryCard";
import { BillingOverviewCard } from "./BillingOverviewCard";
import { PlanChangeDialog } from "./PlanChangeDialog";
import { formatPrice } from "@/features/landing/pricingData";
import { formatPlanLabel, formatBillingInterval } from "./billingFormatters";

export function BillingSettingsTab() {
  const { data, isLoading, isError, error, refetch } = useSubscription();
  const {
    data: invoiceData,
    isLoading: isInvoicesLoading,
    isError: isInvoicesError,
    refetch: refetchInvoices,
  } = useInvoices();
  const changePlan = useChangePlan();
  const cancelSubscription = useCancelSubscription();
  const reactivateSubscription = useReactivateSubscription();
  const paymentRef = useRef(null);

  const [interval, setInterval] = useState("month");
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState(null);

  useEffect(() => {
    if (data?.billing?.interval) {
      setInterval(data.billing.interval);
    }
  }, [data?.billing?.interval]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-72 xl:col-span-1" />
          <Skeleton className="h-72 xl:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <p className="text-text-secondary">
          {error instanceof Error ? error.message : "Failed to load billing details."}
        </p>
        <Button className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const billing = data.billing;
  const limits = data.limits;
  const plans = data.plans ?? [];
  const paymentMethods = data.paymentMethods ?? [];
  const currentPlanDetails = plans.find((plan) => plan.id === billing.plan);
  const pendingPlanDetails = plans.find((plan) => plan.id === pendingPlan);
  const currentPlanDetailsForPending = plans.find((plan) => plan.id === billing.plan);

  function handleSelectPlan(planId) {
    if (planId === billing.plan) return;
    setPendingPlan(planId);
  }

  async function confirmPlanChange() {
    if (!pendingPlan) return;
    await changePlan.mutateAsync({
      plan: pendingPlan,
      interval,
    });
    setPendingPlan(null);
  }

  function openPaymentDialog() {
    paymentRef.current?.openDialog?.();
  }

  const pendingPriceCents = pendingPlanDetails
    ? interval === "year"
      ? pendingPlanDetails.yearlyPriceCents
      : pendingPlanDetails.monthlyPriceCents
    : 0;

  const currentPriceCents = currentPlanDetailsForPending
    ? billing.interval === "year"
      ? currentPlanDetailsForPending.yearlyPriceCents
      : currentPlanDetailsForPending.monthlyPriceCents
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-text-primary">Billing</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your subscription, payment method, and invoices in one place.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-1">
          <BillingOverviewCard
            billing={billing}
            paymentMethods={paymentMethods}
            currentPlanDetails={currentPlanDetails}
            onChangePlan={() => setPlanDialogOpen(true)}
            onManagePayment={openPaymentDialog}
            onCancel={() => setCancelOpen(true)}
            onReactivate={() => reactivateSubscription.mutate()}
            isReactivating={reactivateSubscription.isPending}
          />

          <PaymentMethodCard
            ref={paymentRef}
            billing={billing}
            paymentMethods={paymentMethods}
            onUpdated={refetch}
          />

          <Card className="p-5">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Plan usage</CardTitle>
              <CardDescription className="mt-1">
                Limits apply when inviting members or creating projects.
              </CardDescription>
            </CardHeader>
            <div className="mt-4">
              <UsageLimitsCard usage={limits.usage} limits={limits} />
            </div>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <OrderHistoryCard
            invoices={invoiceData?.invoices ?? []}
            isLoading={isInvoicesLoading}
            isError={isInvoicesError}
            onRetry={refetchInvoices}
          />
        </div>
      </div>

      <PlanChangeDialog
        open={planDialogOpen}
        onOpenChange={setPlanDialogOpen}
        plans={plans}
        currentPlan={billing.plan}
        interval={interval || billing.interval}
        onIntervalChange={setInterval}
        onSelectPlan={handleSelectPlan}
        isLoading={changePlan.isPending}
      />

      <ConfirmDialog
        open={Boolean(pendingPlan)}
        onOpenChange={(open) => {
          if (!open) setPendingPlan(null);
        }}
        title="Confirm plan change"
        description={
          pendingPlanDetails ? (
            <div className="space-y-4 text-left">
              <p>
                You&apos;re switching from{" "}
                <strong>{formatPlanLabel(billing.plan)}</strong> to{" "}
                <strong>{pendingPlanDetails.name}</strong>.
              </p>
              <div className="grid gap-3 rounded-lg border border-border bg-surface/50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-text-muted">Current</p>
                  <p className="mt-1 font-semibold text-text-primary">
                    {formatPrice(currentPriceCents)}/
                    {billing.interval === "year" ? "yr" : "mo"}
                  </p>
                  <p className="mt-1 text-text-secondary">
                    {formatBillingInterval(billing.interval)}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted">New</p>
                  <p className="mt-1 font-semibold text-primary">
                    {formatPrice(pendingPriceCents)}/
                    {interval === "year" ? "yr" : "mo"}
                  </p>
                  <p className="mt-1 text-text-secondary">
                    {formatBillingInterval(interval)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-text-secondary">
                Your team and project limits update immediately. Billing adjusts
                on your next cycle.
              </p>
            </div>
          ) : (
            "Confirm plan change?"
          )
        }
        confirmLabel="Confirm change"
        variant="primary"
        onConfirm={confirmPlanChange}
        isLoading={changePlan.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel subscription?"
        description="Your organization keeps full access until the end of the current billing period. After that, creating projects and inviting users will be blocked until you reactivate."
        confirmLabel="Cancel at period end"
        variant="danger"
        onConfirm={async () => {
          await cancelSubscription.mutateAsync();
          setCancelOpen(false);
        }}
        isLoading={cancelSubscription.isPending}
      />
    </div>
  );
}

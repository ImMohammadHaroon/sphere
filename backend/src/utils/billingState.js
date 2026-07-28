import {
  normalizeBillingInterval,
  normalizePlanId,
} from "../config/plans.js";

export function getOrgBillingState(org) {
  const billing = org.billing ?? {};
  const trialEndsAt = billing.trialEndsAt ?? null;
  const daysLeftInTrial =
    billing.status === "trialing" && trialEndsAt
      ? Math.max(
          0,
          Math.ceil((trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        )
      : null;

  return {
    plan: normalizePlanId(billing.plan),
    interval: normalizeBillingInterval(billing.interval),
    status: billing.status ?? "trialing",
    trialEndsAt,
    currentPeriodEnd: billing.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: Boolean(billing.cancelAtPeriodEnd),
    hasPaymentMethod: Boolean(billing.defaultPaymentMethodId),
    paymentMethodLast4: billing.paymentMethodLast4 ?? null,
    paymentMethodBrand: billing.paymentMethodBrand ?? null,
    daysLeftInTrial,
  };
}

export function assertBillingAllowsActions(org) {
  const status = org.billing?.status ?? "trialing";

  if (status === "canceled") {
    const err = new Error(
      "Your subscription is canceled. Reactivate billing in Settings to continue."
    );
    err.status = 402;
    throw err;
  }

  if (status === "past_due") {
    const err = new Error(
      "Your subscription payment is past due. Update your payment method in Billing settings."
    );
    err.status = 402;
    throw err;
  }

  if (status === "incomplete") {
    const trialEndsAt = org.billing?.trialEndsAt;
    if (trialEndsAt && trialEndsAt < new Date()) {
      const err = new Error(
        "Your trial has ended. Add a payment method in Billing settings to continue."
      );
      err.status = 402;
      throw err;
    }
  }
}

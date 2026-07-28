import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { BillingOrder } from "../models/BillingOrder.js";
import { env } from "../config/env.js";
import {
  formatPlansForApi,
  getPlan,
  getStripePriceId,
  normalizeBillingInterval,
  normalizePlanId,
  PLANS,
} from "../config/plans.js";
import {
  cancelSubscriptionAtPeriodEnd,
  createSetupIntent,
  createStripeCustomer,
  createTrialSubscription,
  isStripeConfigured,
  reactivateSubscription,
  retrieveCustomerPaymentMethod,
  retrieveSubscription,
  updateSubscriptionPlan,
  listCustomerCardPaymentMethods,
  setCustomerDefaultPaymentMethod,
  retrievePaymentMethod,
  detachPaymentMethod,
  clearCustomerDefaultPaymentMethod,
  payInvoiceWithPaymentMethod,
  updateInvoiceMetadata,
  retrieveSetupIntent,
  listCustomerInvoices,
  retrieveInvoice,
  retrieveUpcomingInvoice,
} from "./stripe.service.js";
import { getOrgLimitsSummary } from "./planLimits.service.js";
import {
  getOrgBillingState,
} from "../utils/billingState.js";

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function mapStripeStatus(status) {
  const allowed = ["trialing", "active", "past_due", "canceled", "incomplete"];
  return allowed.includes(status) ? status : "incomplete";
}

function toDate(unixSeconds) {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000);
}

export { getOrgBillingState };

async function syncPaymentMethodFromStripe(org) {
  if (!org.billing?.stripeCustomerId || !isStripeConfigured()) {
    return org;
  }

  try {
    let paymentMethod = await retrieveCustomerPaymentMethod(
      org.billing.stripeCustomerId
    );

    if (!paymentMethod) {
      const methods = await listCustomerCardPaymentMethods(
        org.billing.stripeCustomerId
      );
      const latestMethod = methods[0] ?? null;
      if (latestMethod) {
        paymentMethod = await setCustomerDefaultPaymentMethod(
          org.billing.stripeCustomerId,
          latestMethod.id,
          org.billing.stripeSubscriptionId ?? null
        );
      }
    }

    if (paymentMethod?.card) {
      org.billing.defaultPaymentMethodId = paymentMethod.id;
      org.billing.paymentMethodLast4 = paymentMethod.card.last4 ?? null;
      org.billing.paymentMethodBrand = paymentMethod.card.brand ?? null;
      await org.save();
    }
  } catch (err) {
    console.error("Failed to sync payment method:", err.message);
  }

  return org;
}

async function savePaymentMethodOnOrg(org, paymentMethod) {
  if (!paymentMethod?.id) return org;

  org.billing = org.billing ?? {};
  org.billing.defaultPaymentMethodId = paymentMethod.id;
  org.billing.paymentMethodLast4 = paymentMethod.card?.last4 ?? null;
  org.billing.paymentMethodBrand = paymentMethod.card?.brand ?? null;
  await org.save();
  return org;
}

function formatPaymentMethodSummary(paymentMethod, defaultPaymentMethodId) {
  return {
    id: paymentMethod.id,
    brand: paymentMethod.card?.brand ?? null,
    last4: paymentMethod.card?.last4 ?? null,
    expMonth: paymentMethod.card?.exp_month ?? null,
    expYear: paymentMethod.card?.exp_year ?? null,
    isDefault: paymentMethod.id === defaultPaymentMethodId,
  };
}

async function getOrganizationPaymentMethods(org) {
  if (!org.billing?.stripeCustomerId || !isStripeConfigured()) {
    return [];
  }

  const methods = await listCustomerCardPaymentMethods(
    org.billing.stripeCustomerId
  );
  const defaultId = org.billing.defaultPaymentMethodId ?? null;

  return methods.map((method) => formatPaymentMethodSummary(method, defaultId));
}

async function assertPaymentMethodBelongsToOrg(org, paymentMethodId) {
  if (!org.billing?.stripeCustomerId) {
    throw httpError("No billing account found for this organization", 404);
  }

  const paymentMethod = await retrievePaymentMethod(paymentMethodId);
  const customerId =
    typeof paymentMethod.customer === "string"
      ? paymentMethod.customer
      : paymentMethod.customer?.id;

  if (customerId !== org.billing.stripeCustomerId) {
    throw httpError("Payment method not found", 404);
  }

  return paymentMethod;
}

async function setOrgDefaultPaymentMethod(org, paymentMethodId) {
  const paymentMethod = await setCustomerDefaultPaymentMethod(
    org.billing.stripeCustomerId,
    paymentMethodId,
    org.billing.stripeSubscriptionId ?? null
  );
  await savePaymentMethodOnOrg(org, paymentMethod);
  return paymentMethod;
}

function getInvoicePaymentMethodId(invoice) {
  const defaultPm = invoice.default_payment_method;
  if (!defaultPm) return null;
  return typeof defaultPm === "string" ? defaultPm : defaultPm.id;
}

function getFallbackTriedPaymentMethodIds(invoice) {
  const raw = invoice.metadata?.fallback_tried_pms ?? "";
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function attemptInvoiceFallbackPayments(org, invoice) {
  if (!org?.billing?.stripeCustomerId || !invoice?.id) {
    return { recovered: false, paymentMethodId: null };
  }

  if (invoice.status === "paid" || invoice.amount_due === 0) {
    return { recovered: true, paymentMethodId: getInvoicePaymentMethodId(invoice) };
  }

  const customerId = org.billing.stripeCustomerId;
  const methods = await listCustomerCardPaymentMethods(customerId);
  if (methods.length === 0) {
    return { recovered: false, paymentMethodId: null };
  }

  const primaryPaymentMethodId = org.billing.defaultPaymentMethodId ?? null;
  const failedPaymentMethodId = getInvoicePaymentMethodId(invoice);
  const alreadyTried = new Set(getFallbackTriedPaymentMethodIds(invoice));

  const orderedMethods = [];
  if (primaryPaymentMethodId) {
    const primary = methods.find((method) => method.id === primaryPaymentMethodId);
    if (primary) orderedMethods.push(primary);
  }
  for (const method of methods) {
    if (!orderedMethods.some((entry) => entry.id === method.id)) {
      orderedMethods.push(method);
    }
  }

  const candidates = orderedMethods.filter((method) => {
    if (alreadyTried.has(method.id)) return false;
    if (failedPaymentMethodId && method.id === failedPaymentMethodId) return false;
    if (primaryPaymentMethodId && method.id === primaryPaymentMethodId) return false;
    return true;
  });

  const attemptedIds = [...alreadyTried];

  for (const method of candidates) {
    attemptedIds.push(method.id);

    try {
      const paidInvoice = await payInvoiceWithPaymentMethod(invoice.id, method.id);
      if (paidInvoice.status === "paid") {
        console.info(
          `Recovered invoice ${invoice.id} using fallback card ${method.id}`
        );
        return { recovered: true, paymentMethodId: method.id };
      }
    } catch (err) {
      console.warn(
        `Fallback charge failed for invoice ${invoice.id} on card ${method.id}:`,
        err.message
      );
    }
  }

  await updateInvoiceMetadata(invoice.id, {
    ...(invoice.metadata ?? {}),
    fallback_tried_pms: [...new Set(attemptedIds)].join(","),
  });

  return { recovered: false, paymentMethodId: null };
}

export async function applySubscriptionToOrg(org, subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
  const planEntry = Object.values(PLANS).find(
    (plan) =>
      plan.stripePriceIdMonthly === priceId ||
      plan.stripePriceIdYearly === priceId
  );

  org.billing = org.billing ?? {};
  org.billing.stripeSubscriptionId = subscription.id;
  org.billing.stripePriceId = priceId;
  org.billing.status = mapStripeStatus(subscription.status);
  org.billing.trialEndsAt = toDate(subscription.trial_end);
  org.billing.currentPeriodEnd = toDate(subscription.current_period_end);
  org.billing.cancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end);

  if (planEntry) {
    org.billing.plan = planEntry.id;
    org.billing.interval =
      priceId === planEntry.stripePriceIdYearly ? "year" : "month";
  }

  await org.save();
  return syncPaymentMethodFromStripe(org);
}

export async function startTrialSubscription({
  organization,
  adminEmail,
  adminName,
  planId,
  interval,
}) {
  const normalizedPlan = normalizePlanId(planId);
  const normalizedInterval = normalizeBillingInterval(interval);
  const priceId = getStripePriceId(normalizedPlan, normalizedInterval);
  const trialEndsAt = new Date(
    Date.now() + env.STRIPE_TRIAL_DAYS * 24 * 60 * 60 * 1000
  );

  organization.billing = organization.billing ?? {};
  organization.billing.plan = normalizedPlan;
  organization.billing.interval = normalizedInterval;
  organization.billing.status = "trialing";
  organization.billing.trialEndsAt = trialEndsAt;

  if (!isStripeConfigured()) {
    await organization.save();
    return organization;
  }

  const customer = await createStripeCustomer({
    email: adminEmail,
    name: adminName,
    organizationId: organization._id,
  });

  const subscription = await createTrialSubscription({
    customerId: customer.id,
    priceId,
    trialDays: env.STRIPE_TRIAL_DAYS,
  });

  organization.billing.stripeCustomerId = customer.id;
  organization.billing.stripeSubscriptionId = subscription.id;
  organization.billing.stripePriceId = priceId;
  organization.billing.trialEndsAt = toDate(subscription.trial_end) ?? trialEndsAt;
  organization.billing.currentPeriodEnd = toDate(subscription.current_period_end);
  organization.billing.status = mapStripeStatus(subscription.status);

  await organization.save();
  return organization;
}

export function listPublicPlans() {
  return formatPlansForApi();
}

export async function getSubscriptionDetails(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  await syncPaymentMethodFromStripe(org);

  const limits = await getOrgLimitsSummary(organizationId);
  const plan = getPlan(normalizePlanId(org.billing?.plan));
  const paymentMethods = await getOrganizationPaymentMethods(org);

  return {
    organization: {
      id: org._id.toString(),
      name: org.name,
    },
    billing: {
      ...getOrgBillingState(org),
      hasPaymentMethod: paymentMethods.length > 0,
    },
    paymentMethods,
    limits: {
      maxUsers: plan.maxUsers,
      maxProjects: plan.maxProjects,
      usage: limits.usage,
    },
    plans: listPublicPlans(),
  };
}

export async function createBillingSetupIntent(organizationId) {
  let org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  org = await ensureStripeCustomer(org);

  const setupIntent = await createSetupIntent(org.billing.stripeCustomerId);
  return {
    clientSecret: setupIntent.client_secret,
  };
}

export async function confirmPaymentMethodFromSetup({
  organizationId,
  setupIntentId,
  setAsDefault,
}) {
  let org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  org = await ensureStripeCustomer(org);

  const setupIntent = await retrieveSetupIntent(setupIntentId);
  const customerId =
    typeof setupIntent.customer === "string"
      ? setupIntent.customer
      : setupIntent.customer?.id;

  if (customerId !== org.billing.stripeCustomerId) {
    throw httpError("Invalid payment setup session", 400);
  }

  if (setupIntent.status !== "succeeded") {
    throw httpError("Payment method was not confirmed", 400);
  }

  const paymentMethodId =
    typeof setupIntent.payment_method === "string"
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

  if (!paymentMethodId) {
    throw httpError("No payment method found on setup session", 400);
  }

  const attachedMethods = await listCustomerCardPaymentMethods(
    org.billing.stripeCustomerId
  );
  const shouldSetDefault =
    setAsDefault === true
      ? true
      : setAsDefault === false
        ? false
        : attachedMethods.length === 1;

  if (shouldSetDefault) {
    await setOrgDefaultPaymentMethod(org, paymentMethodId);
  }

  return getSubscriptionDetails(organizationId);
}

export async function setOrganizationDefaultPaymentMethod(
  organizationId,
  paymentMethodId
) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  await assertPaymentMethodBelongsToOrg(org, paymentMethodId);
  await setOrgDefaultPaymentMethod(org, paymentMethodId);

  return getSubscriptionDetails(organizationId);
}

export async function removeOrganizationPaymentMethod(
  organizationId,
  paymentMethodId
) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  await assertPaymentMethodBelongsToOrg(org, paymentMethodId);

  const methods = await listCustomerCardPaymentMethods(
    org.billing.stripeCustomerId
  );
  const isDefault = org.billing.defaultPaymentMethodId === paymentMethodId;

  await detachPaymentMethod(paymentMethodId);

  if (isDefault) {
    const remaining = methods.filter((method) => method.id !== paymentMethodId);
    if (remaining.length > 0) {
      await setOrgDefaultPaymentMethod(org, remaining[0].id);
    } else {
      await clearCustomerDefaultPaymentMethod(
        org.billing.stripeCustomerId,
        org.billing.stripeSubscriptionId ?? null
      );
      org.billing.defaultPaymentMethodId = null;
      org.billing.paymentMethodLast4 = null;
      org.billing.paymentMethodBrand = null;
      await org.save();
    }
  }

  return getSubscriptionDetails(organizationId);
}

async function ensureStripeCustomer(org) {
  if (org.billing?.stripeCustomerId) {
    return org;
  }

  if (!isStripeConfigured()) {
    throw httpError("Stripe billing is not configured on the server", 503);
  }

  const admin = await User.findOne({
    organizationId: org._id,
    role: "org_admin",
    isActive: true,
  }).select("email name");

  if (!admin) {
    throw httpError("Organization admin not found", 404);
  }

  const customer = await createStripeCustomer({
    email: admin.email,
    name: admin.name,
    organizationId: org._id,
  });

  org.billing = org.billing ?? {};
  org.billing.stripeCustomerId = customer.id;
  await org.save();

  return org;
}

function getPlanAmountCents(planId, interval) {
  const plan = getPlan(planId);
  return interval === "year" ? plan.yearlyPriceCents : plan.monthlyPriceCents;
}

function formatPlanLabel(planId, interval) {
  const plan = getPlan(planId);
  const cycle = interval === "year" ? "Yearly" : "Monthly";
  return `${plan.name} (${cycle})`;
}

async function recordBillingOrder({
  organizationId,
  type,
  plan,
  interval,
  status,
  description,
  stripeInvoiceId = null,
  stripeSubscriptionId = null,
}) {
  return BillingOrder.create({
    organizationId,
    type,
    plan,
    interval,
    amountCents: getPlanAmountCents(plan, interval),
    currency: "usd",
    status,
    description,
    stripeInvoiceId,
    stripeSubscriptionId,
  });
}

async function ensureStripeSubscription(org) {
  if (org.billing?.stripeSubscriptionId || !isStripeConfigured()) {
    return org;
  }

  org = await ensureStripeCustomer(org);

  const plan = normalizePlanId(org.billing?.plan);
  const interval = normalizeBillingInterval(org.billing?.interval);
  const priceId = getStripePriceId(plan, interval);

  const trialEndsAt = org.billing?.trialEndsAt;
  const trialDays =
    trialEndsAt && trialEndsAt > new Date()
      ? Math.max(
          1,
          Math.ceil(
            (trialEndsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
          )
        )
      : env.STRIPE_TRIAL_DAYS;

  const subscription = await createTrialSubscription({
    customerId: org.billing.stripeCustomerId,
    priceId,
    trialDays,
  });

  org.billing.stripeSubscriptionId = subscription.id;
  org.billing.stripePriceId = priceId;
  org.billing.trialEndsAt = toDate(subscription.trial_end) ?? org.billing.trialEndsAt;
  org.billing.currentPeriodEnd = toDate(subscription.current_period_end);
  org.billing.status = mapStripeStatus(subscription.status);
  await org.save();

  return org;
}

export async function changeOrganizationPlan({
  organizationId,
  planId,
  interval,
}) {
  let org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  const normalizedPlan = normalizePlanId(planId ?? org.billing?.plan);
  const normalizedInterval = normalizeBillingInterval(
    interval ?? org.billing?.interval
  );
  const priceId = getStripePriceId(normalizedPlan, normalizedInterval);
  const previousPlan = normalizePlanId(org.billing?.plan);
  const previousInterval = normalizeBillingInterval(org.billing?.interval);
  const planChanged =
    previousPlan !== normalizedPlan || previousInterval !== normalizedInterval;

  org.billing = org.billing ?? {};
  org.billing.plan = normalizedPlan;
  org.billing.interval = normalizedInterval;
  org.billing.stripePriceId = priceId;

  if (isStripeConfigured()) {
    org = await ensureStripeSubscription(org);

    if (org.billing.stripeSubscriptionId) {
      const subscription = await updateSubscriptionPlan({
        subscriptionId: org.billing.stripeSubscriptionId,
        priceId,
      });
      await applySubscriptionToOrg(org, subscription);

      if (planChanged) {
        const billingStatus = org.billing?.status ?? "trialing";
        const latestInvoice = subscription.latest_invoice;
        const stripeInvoiceId =
          typeof latestInvoice === "string"
            ? latestInvoice
            : latestInvoice?.id ?? null;

        await recordBillingOrder({
          organizationId: org._id,
          type: "plan_change",
          plan: normalizedPlan,
          interval: normalizedInterval,
          status: billingStatus === "trialing" ? "scheduled" : "open",
          description: `Plan changed to ${formatPlanLabel(normalizedPlan, normalizedInterval)}`,
          stripeInvoiceId,
          stripeSubscriptionId: org.billing.stripeSubscriptionId,
        });
      }
    } else if (planChanged) {
      await recordBillingOrder({
        organizationId: org._id,
        type: "plan_change",
        plan: normalizedPlan,
        interval: normalizedInterval,
        status: "scheduled",
        description: `Plan changed to ${formatPlanLabel(normalizedPlan, normalizedInterval)}`,
      });
    }
  } else if (planChanged) {
    await org.save();
    await recordBillingOrder({
      organizationId: org._id,
      type: "plan_change",
      plan: normalizedPlan,
      interval: normalizedInterval,
      status: "scheduled",
      description: `Plan changed to ${formatPlanLabel(normalizedPlan, normalizedInterval)}`,
    });
  } else {
    await org.save();
  }

  return getSubscriptionDetails(organizationId);
}

export async function cancelOrganizationSubscription(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  if (isStripeConfigured() && org.billing?.stripeSubscriptionId) {
    const subscription = await cancelSubscriptionAtPeriodEnd(
      org.billing.stripeSubscriptionId
    );
    await applySubscriptionToOrg(org, subscription);
  } else {
    org.billing.cancelAtPeriodEnd = true;
    await org.save();
  }

  return getSubscriptionDetails(organizationId);
}

export async function reactivateOrganizationSubscription(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }

  if (isStripeConfigured() && org.billing?.stripeSubscriptionId) {
    const subscription = await reactivateSubscription(
      org.billing.stripeSubscriptionId
    );
    await applySubscriptionToOrg(org, subscription);
  } else {
    org.billing.cancelAtPeriodEnd = false;
    await org.save();
  }

  return getSubscriptionDetails(organizationId);
}

export async function handleStripeWebhookEvent(event) {
  switch (event.type) {
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const org = await Organization.findOne({
        "billing.stripeSubscriptionId": subscription.id,
      });
      if (org) {
        await applySubscriptionToOrg(org, subscription);
      }
      break;
    }
    case "setup_intent.succeeded": {
      const setupIntent = event.data.object;
      const customerId =
        typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer?.id;
      const org = await Organization.findOne({
        "billing.stripeCustomerId": customerId,
      });
      if (org && setupIntent.payment_method) {
        const paymentMethodId =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
        const methods = await listCustomerCardPaymentMethods(customerId);
        const shouldSetDefault =
          !org.billing?.defaultPaymentMethodId || methods.length <= 1;
        if (shouldSetDefault) {
          await setOrgDefaultPaymentMethod(org, paymentMethodId);
        }
      }
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      const org = await Organization.findOne({
        "billing.stripeCustomerId": customerId,
      });
      if (!org) break;

      const fallback = await attemptInvoiceFallbackPayments(org, invoice);
      if (fallback.recovered) {
        if (org.billing?.stripeSubscriptionId) {
          const subscription = await retrieveSubscription(
            org.billing.stripeSubscriptionId
          );
          await applySubscriptionToOrg(org, subscription);
        }
        if (invoice.id) {
          await BillingOrder.updateMany(
            { stripeInvoiceId: invoice.id },
            { status: "paid" }
          );
        }
      } else {
        org.billing.status = "past_due";
        await org.save();
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object;
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      const org = await Organization.findOne({
        "billing.stripeCustomerId": customerId,
      });
      if (org?.billing?.stripeSubscriptionId) {
        const subscription = await retrieveSubscription(
          org.billing.stripeSubscriptionId
        );
        await applySubscriptionToOrg(org, subscription);
      }
      if (invoice.id) {
        await BillingOrder.updateMany(
          { stripeInvoiceId: invoice.id },
          { status: "paid" }
        );
      }
      break;
    }
    default:
      break;
  }
}

export async function getBillingSummaryForUser(org) {
  if (!org) return null;
  const billing = getOrgBillingState(org);
  return {
    billingStatus: billing.status,
    trialEndsAt: billing.trialEndsAt,
    plan: billing.plan,
    daysLeftInTrial: billing.daysLeftInTrial,
    hasPaymentMethod: billing.hasPaymentMethod,
  };
}

function formatInvoiceSummary(invoice) {
  const line = invoice.lines?.data?.[0];
  return {
    id: invoice.id,
    number: invoice.number ?? null,
    status: invoice.status,
    amountDue: invoice.amount_due ?? 0,
    amountPaid: invoice.amount_paid ?? 0,
    currency: invoice.currency ?? "usd",
    createdAt: toDate(invoice.created),
    periodStart: toDate(invoice.period_start),
    periodEnd: toDate(invoice.period_end),
    description:
      line?.description ??
      (invoice.billing_reason === "subscription_create"
        ? "Subscription started"
        : "Subscription"),
    pdfUrl: invoice.invoice_pdf ?? null,
    hostedUrl: invoice.hosted_invoice_url ?? null,
  };
}

async function getOrgWithStripeCustomer(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org) {
    throw httpError("Organization not found", 404);
  }
  return org;
}

function formatBillingOrderSummary(order) {
  return {
    id: order._id.toString(),
    source: "order",
    number: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
    status: order.status,
    amountDue: order.amountCents,
    amountPaid: order.status === "paid" ? order.amountCents : 0,
    currency: order.currency ?? "usd",
    createdAt: order.createdAt,
    periodStart: null,
    periodEnd: null,
    description: order.description,
    pdfUrl: null,
    hostedUrl: null,
    plan: order.plan,
    interval: order.interval,
    stripeInvoiceId: order.stripeInvoiceId,
  };
}

function mergeInvoiceHistory(stripeInvoices, billingOrders) {
  const stripeIds = new Set(
    stripeInvoices.map((invoice) => invoice.id).filter(Boolean)
  );

  const orderItems = billingOrders
    .filter((order) => !order.stripeInvoiceId || !stripeIds.has(order.stripeInvoiceId))
    .map(formatBillingOrderSummary);

  const invoiceItems = stripeInvoices.map((invoice) => ({
    ...invoice,
    source: "stripe",
  }));

  return [...invoiceItems, ...orderItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getOrganizationInvoices(organizationId) {
  const org = await getOrgWithStripeCustomer(organizationId);

  const billingOrders = await BillingOrder.find({
    organizationId: org._id,
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (!isStripeConfigured() || !org.billing?.stripeCustomerId) {
    return {
      invoices: mergeInvoiceHistory([], billingOrders),
      upcoming: null,
    };
  }

  const invoices = await listCustomerInvoices(org.billing.stripeCustomerId);
  let upcoming = null;

  if (org.billing.stripeSubscriptionId) {
    try {
      upcoming = await retrieveUpcomingInvoice({
        customerId: org.billing.stripeCustomerId,
        subscriptionId: org.billing.stripeSubscriptionId,
      });
    } catch (err) {
      console.error("Failed to load upcoming invoice preview:", err.message);
    }
  }

  const stripeInvoices = invoices.map(formatInvoiceSummary);

  return {
    invoices: mergeInvoiceHistory(stripeInvoices, billingOrders),
    upcoming: upcoming ? formatInvoiceSummary(upcoming) : null,
  };
}

export async function getOrganizationInvoice(organizationId, invoiceId) {
  const org = await getOrgWithStripeCustomer(organizationId);

  if (!isStripeConfigured() || !org.billing?.stripeCustomerId) {
    throw httpError("No billing account found for this organization", 404);
  }

  const invoice = await retrieveInvoice(invoiceId);
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (customerId !== org.billing.stripeCustomerId) {
    throw httpError("Invoice not found", 404);
  }

  return { invoice: formatInvoiceSummary(invoice) };
}

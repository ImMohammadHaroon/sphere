import Stripe from "stripe";
import { env } from "../config/env.js";

let stripeClient = null;

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!isStripeConfigured()) {
    const err = new Error("Stripe is not configured");
    err.status = 503;
    throw err;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export async function createStripeCustomer({ email, name, organizationId }) {
  const stripe = getStripe();
  return stripe.customers.create({
    email,
    name,
    metadata: {
      organizationId: organizationId.toString(),
    },
  });
}

export async function createTrialSubscription({
  customerId,
  priceId,
  trialDays,
}) {
  const stripe = getStripe();
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    payment_behavior: "default_incomplete",
    payment_settings: {
      save_default_payment_method: "on_subscription",
    },
    metadata: {
      source: "projectsphere_signup",
    },
  });
}

export async function createSetupIntent(customerId) {
  const stripe = getStripe();
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ["card"],
    usage: "off_session",
  });
}

export async function updateSubscriptionPlan({
  subscriptionId,
  priceId,
  prorationBehavior = "create_prorations",
}) {
  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;

  if (!itemId) {
    const err = new Error("Subscription has no items");
    err.status = 400;
    throw err;
  }

  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: prorationBehavior,
    expand: ["latest_invoice"],
  });
}

export async function cancelSubscriptionAtPeriodEnd(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

export async function reactivateSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function retrieveSubscription(subscriptionId) {
  const stripe = getStripe();
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });
}

export async function retrieveCustomerPaymentMethod(customerId) {
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(customerId, {
    expand: ["invoice_settings.default_payment_method"],
  });

  if (customer.deleted) {
    return null;
  }

  const paymentMethod = customer.invoice_settings?.default_payment_method;
  if (!paymentMethod || typeof paymentMethod === "string") {
    return null;
  }

  return paymentMethod;
}

export async function listCustomerCardPaymentMethods(customerId) {
  const stripe = getStripe();
  const result = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });
  return result.data;
}

export async function setCustomerDefaultPaymentMethod(
  customerId,
  paymentMethodId,
  subscriptionId = null
) {
  const stripe = getStripe();
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  if (subscriptionId) {
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: paymentMethodId,
    });
  }

  return stripe.paymentMethods.retrieve(paymentMethodId);
}

export async function payInvoiceWithPaymentMethod(invoiceId, paymentMethodId) {
  const stripe = getStripe();
  return stripe.invoices.pay(invoiceId, {
    payment_method: paymentMethodId,
    off_session: true,
  });
}

export async function updateInvoiceMetadata(invoiceId, metadata) {
  const stripe = getStripe();
  return stripe.invoices.update(invoiceId, { metadata });
}

export async function retrievePaymentMethod(paymentMethodId) {
  const stripe = getStripe();
  return stripe.paymentMethods.retrieve(paymentMethodId);
}

export async function detachPaymentMethod(paymentMethodId) {
  const stripe = getStripe();
  return stripe.paymentMethods.detach(paymentMethodId);
}

export async function clearCustomerDefaultPaymentMethod(
  customerId,
  subscriptionId = null
) {
  const stripe = getStripe();
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: "",
    },
  });

  if (subscriptionId) {
    await stripe.subscriptions.update(subscriptionId, {
      default_payment_method: "",
    });
  }
}

export async function retrieveSetupIntent(setupIntentId) {
  const stripe = getStripe();
  return stripe.setupIntents.retrieve(setupIntentId);
}

export async function listCustomerInvoices(customerId, { limit = 24 } = {}) {
  const stripe = getStripe();
  const result = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return result.data;
}

export async function retrieveInvoice(invoiceId) {
  const stripe = getStripe();
  return stripe.invoices.retrieve(invoiceId);
}

export async function retrieveUpcomingInvoice({ customerId, subscriptionId }) {
  const stripe = getStripe();
  try {
    return await stripe.invoices.createPreview({
      customer: customerId,
      subscription: subscriptionId,
    });
  } catch (err) {
    if (
      err?.code === "invoice_upcoming_none" ||
      err?.code === "resource_missing"
    ) {
      return null;
    }
    throw err;
  }
}

export function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}

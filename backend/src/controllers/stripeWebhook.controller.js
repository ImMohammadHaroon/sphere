import { handleStripeWebhookEvent } from "../services/billing.service.js";
import { constructWebhookEvent } from "../services/stripe.service.js";
import { isStripeConfigured } from "../services/stripe.service.js";

export async function handleStripeWebhook(req, res, next) {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({ message: "Stripe is not configured" });
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
      return res.status(400).json({ message: "Missing Stripe signature" });
    }

    const event = constructWebhookEvent(req.body, signature);
    await handleStripeWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error("Stripe webhook error:", err.message);
    err.status = err.status || 400;
    next(err);
  }
}

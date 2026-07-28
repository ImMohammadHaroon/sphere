import dotenv from "dotenv";
import Stripe from "stripe";
import { PLANS } from "../config/plans.js";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY in environment");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

async function findOrCreateProduct(plan) {
  const existing = await stripe.products.search({
    query: `metadata['plan_id']:'${plan.id}'`,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.products.create({
    name: `ProjectSphere ${plan.name}`,
    description: plan.description,
    metadata: {
      plan_id: plan.id,
    },
  });
}

async function findOrCreatePrice({ productId, planId, interval, amount }) {
  const lookupKey = `${planId}_${interval}`;
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.prices.create({
    product: productId,
    unit_amount: amount,
    currency: "usd",
    recurring: { interval },
    lookup_key: lookupKey,
    transfer_lookup_key: true,
    metadata: {
      plan_id: planId,
      interval,
    },
  });
}

async function seedStripeProducts() {
  console.log("Creating Stripe products and prices...\n");

  const results = {};

  for (const plan of Object.values(PLANS)) {
    const product = await findOrCreateProduct(plan);
    const monthlyPrice = await findOrCreatePrice({
      productId: product.id,
      planId: plan.id,
      interval: "month",
      amount: plan.monthlyPriceCents,
    });
    const yearlyPrice = await findOrCreatePrice({
      productId: product.id,
      planId: plan.id,
      interval: "year",
      amount: plan.yearlyPriceCents,
    });

    results[plan.id] = {
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      yearlyPriceId: yearlyPrice.id,
    };

    console.log(`${plan.name}:`);
    console.log(`  Product: ${product.id}`);
    console.log(`  Monthly: ${monthlyPrice.id}`);
    console.log(`  Yearly:  ${yearlyPrice.id}`);
    console.log("");
  }

  console.log("Add these to backend/.env:\n");
  for (const [planId, ids] of Object.entries(results)) {
    const key = planId.toUpperCase();
    console.log(`STRIPE_PRICE_${key}_MONTHLY=${ids.monthlyPriceId}`);
    console.log(`STRIPE_PRICE_${key}_YEARLY=${ids.yearlyPriceId}`);
  }
}

seedStripeProducts().catch((err) => {
  console.error(err);
  process.exit(1);
});

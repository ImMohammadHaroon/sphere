export const PLAN_IDS = ["starter", "professional", "business"];

export const BILLING_INTERVALS = ["month", "year"];

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started with project management.",
    maxUsers: 5,
    maxProjects: 5,
    monthlyPriceCents: 1900,
    yearlyPriceCents: 19000,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly",
    stripePriceIdYearly:
      process.env.STRIPE_PRICE_STARTER_YEARLY || "price_starter_yearly",
    features: [
      "Up to 5 team members",
      "Up to 5 projects",
      "Custom Kanban boards",
      "Task management & comments",
      "Basic reports",
    ],
    highlighted: false,
  },
  professional: {
    id: "professional",
    name: "Professional",
    description: "For growing teams that need client visibility and milestones.",
    maxUsers: 25,
    maxProjects: 25,
    monthlyPriceCents: 4900,
    yearlyPriceCents: 49000,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ||
      "price_professional_monthly",
    stripePriceIdYearly:
      process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY ||
      "price_professional_yearly",
    features: [
      "Up to 25 team members",
      "Up to 25 projects",
      "Client portal access",
      "Milestones & calendar",
      "Advanced reports & analytics",
    ],
    highlighted: true,
  },
  business: {
    id: "business",
    name: "Business",
    description: "For larger organizations with advanced coordination needs.",
    maxUsers: 100,
    maxProjects: 100,
    monthlyPriceCents: 9900,
    yearlyPriceCents: 99000,
    stripePriceIdMonthly:
      process.env.STRIPE_PRICE_BUSINESS_MONTHLY || "price_business_monthly",
    stripePriceIdYearly:
      process.env.STRIPE_PRICE_BUSINESS_YEARLY || "price_business_yearly",
    features: [
      "Up to 100 team members",
      "Up to 100 projects",
      "Priority support",
      "Advanced security controls",
      "Full reporting suite",
    ],
    highlighted: false,
  },
};

export function getPlan(planId) {
  return PLANS[planId] ?? PLANS.starter;
}

export function getStripePriceId(planId, interval) {
  const plan = getPlan(planId);
  return interval === "year" ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly;
}

export function normalizePlanId(planId) {
  if (planId && PLAN_IDS.includes(planId)) {
    return planId;
  }
  return "starter";
}

export function normalizeBillingInterval(interval) {
  if (interval && BILLING_INTERVALS.includes(interval)) {
    return interval;
  }
  return "month";
}

export function formatPlansForApi() {
  return PLAN_IDS.map((id) => {
    const plan = PLANS[id];
    return {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      maxUsers: plan.maxUsers,
      maxProjects: plan.maxProjects,
      monthlyPriceCents: plan.monthlyPriceCents,
      yearlyPriceCents: plan.yearlyPriceCents,
      features: plan.features,
      highlighted: plan.highlighted,
    };
  });
}

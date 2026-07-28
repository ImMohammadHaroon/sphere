export const DEFAULT_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For small teams getting started with project management.",
    maxUsers: 5,
    maxProjects: 5,
    monthlyPriceCents: 1900,
    yearlyPriceCents: 19000,
    features: [
      "Up to 5 team members",
      "Up to 5 projects",
      "Custom Kanban boards",
      "Task management & comments",
      "Basic reports",
    ],
    highlighted: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For growing teams that need client visibility and milestones.",
    maxUsers: 25,
    maxProjects: 25,
    monthlyPriceCents: 4900,
    yearlyPriceCents: 49000,
    features: [
      "Up to 25 team members",
      "Up to 25 projects",
      "Client portal access",
      "Milestones & calendar",
      "Advanced reports & analytics",
    ],
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For larger organizations with advanced coordination needs.",
    maxUsers: 100,
    maxProjects: 100,
    monthlyPriceCents: 9900,
    yearlyPriceCents: 99000,
    features: [
      "Up to 100 team members",
      "Up to 100 projects",
      "Priority support",
      "Advanced security controls",
      "Full reporting suite",
    ],
    highlighted: false,
  },
];

export function formatPrice(cents) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function getRegisterUrl(planId, interval) {
  const params = new URLSearchParams({
    plan: planId,
    interval,
  });
  return `/register?${params.toString()}`;
}

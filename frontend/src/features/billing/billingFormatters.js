export function formatBillingAmount(cents, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((cents ?? 0) / 100);
}

export function formatBillingDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatInvoiceStatus(status) {
  if (!status) return "Unknown";

  const labels = {
    paid: "Paid",
    open: "Open",
    draft: "Draft",
    void: "Void",
    uncollectible: "Uncollectible",
    scheduled: "Scheduled",
    trialing: "Trial",
    active: "Active",
    past_due: "Past due",
    canceled: "Canceled",
    incomplete: "Incomplete",
  };

  return labels[status] ?? status.replace(/_/g, " ");
}

export function formatSubscriptionStatus(status) {
  return formatInvoiceStatus(status);
}

export function formatPlanLabel(planId) {
  if (!planId) return "—";
  return planId.charAt(0).toUpperCase() + planId.slice(1);
}

export function formatBillingInterval(interval) {
  return interval === "year" ? "Yearly" : "Monthly";
}

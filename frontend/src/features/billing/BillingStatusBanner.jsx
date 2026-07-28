import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

export function BillingStatusBanner({ billing }) {
  if (!billing) return null;

  const showTrialWarning =
    billing.billingStatus === "trialing" &&
    !billing.hasPaymentMethod &&
    billing.daysLeftInTrial !== null &&
    billing.daysLeftInTrial <= 3;

  const showPastDue = billing.billingStatus === "past_due";

  if (!showTrialWarning && !showPastDue) {
    return null;
  }

  const message = showPastDue
    ? "Your subscription payment is past due. Update your payment method to avoid service interruption."
    : `Your free trial ends in ${billing.daysLeftInTrial} day${billing.daysLeftInTrial === 1 ? "" : "s"}. Add a payment method to keep your organization active.`;

  return (
    <Alert variant="info" className="mb-4 flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="flex-1 text-sm">
        <p>{message}</p>
        <Link
          to="/profile?tab=billing"
          className="mt-1 inline-block font-medium text-primary hover:underline"
        >
          Go to Billing settings
        </Link>
      </div>
    </Alert>
  );
}

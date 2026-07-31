import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function ClientReviewBanner({ pendingCount }) {
  if (!pendingCount) return null;

  const label =
    pendingCount === 1
      ? "1 deliverable is ready for you to review"
      : `${pendingCount} deliverables are ready for you to review`;

  return (
    <Card className="border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-text-primary">{label}</p>
            <p className="mt-1 text-sm text-text-secondary">
              Take a quick look and let your team know if everything looks good.
            </p>
          </div>
        </div>
        <Link
          to="/portal/milestones"
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Review now
        </Link>
      </div>
    </Card>
  );
}

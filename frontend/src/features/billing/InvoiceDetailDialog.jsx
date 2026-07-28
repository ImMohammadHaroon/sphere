import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { InvoiceActionButtons } from "./InvoiceActionButtons";
import {
  formatBillingAmount,
  formatBillingDate,
  formatInvoiceStatus,
} from "./billingFormatters";

function statusVariant(status) {
  switch (status) {
    case "paid":
      return "success";
    case "open":
      return "warning";
    case "scheduled":
      return "info";
    case "draft":
      return "muted";
    case "void":
    case "uncollectible":
      return "danger";
    default:
      return "default";
  }
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <dt className="text-sm text-text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

export function InvoiceDetailDialog({ invoice, open, onOpenChange }) {
  if (!invoice) return null;

  const reference = invoice.number ?? invoice.id.slice(-8).toUpperCase();
  const hasInvoiceFile = Boolean(invoice.pdfUrl || invoice.hostedUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Invoice {reference}</DialogTitle>
            <Badge variant={statusVariant(invoice.status)}>
              {formatInvoiceStatus(invoice.status)}
            </Badge>
          </div>
          <DialogDescription>{invoice.description}</DialogDescription>
        </DialogHeader>

        <dl className="divide-y divide-border rounded-lg border border-border bg-surface/50 px-4">
          <DetailRow label="Date" value={formatBillingDate(invoice.createdAt)} />
          <DetailRow
            label="Amount"
            value={formatBillingAmount(
              invoice.amountPaid || invoice.amountDue,
              invoice.currency
            )}
          />
          {invoice.periodStart && invoice.periodEnd ? (
            <DetailRow
              label="Billing period"
              value={`${formatBillingDate(invoice.periodStart)} – ${formatBillingDate(invoice.periodEnd)}`}
            />
          ) : null}
          {invoice.plan ? (
            <DetailRow
              label="Plan"
              value={`${invoice.plan}${invoice.interval ? ` · ${invoice.interval}` : ""}`}
            />
          ) : null}
        </dl>

        <div className="mt-4">
          <p className="mb-3 text-sm font-medium text-text-primary">Invoice actions</p>
          <InvoiceActionButtons invoice={invoice} />
          {!hasInvoiceFile && invoice.status === "scheduled" ? (
            <p className="mt-3 text-sm text-text-secondary">
              This order is scheduled. Download and view links will appear once
              Stripe generates the invoice after your trial or billing cycle starts.
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

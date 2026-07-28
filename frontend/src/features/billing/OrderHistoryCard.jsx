import { useState } from "react";
import { ChevronRight, Receipt } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { InvoiceActionButtons } from "./InvoiceActionButtons";
import { InvoiceDetailDialog } from "./InvoiceDetailDialog";
import {
  formatBillingAmount,
  formatBillingDate,
  formatInvoiceStatus,
} from "./billingFormatters";
import { cn } from "@/lib/utils";

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

export function OrderHistoryCard({ invoices = [], isLoading, isError, onRetry }) {
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-40 w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <CardTitle>Billing history</CardTitle>
        <p className="mt-2 text-sm text-text-secondary">
          Failed to load invoice history.
        </p>
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <CardHeader className="p-0">
          <CardTitle>Billing history</CardTitle>
          <CardDescription className="mt-1">
            Invoices and plan changes for your organization. Click a row for
            details.
          </CardDescription>
        </CardHeader>

        {invoices.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
            <Receipt className="h-10 w-10 text-text-muted" />
            <p className="mt-4 font-medium text-text-primary">No billing activity yet</p>
            <p className="mt-1 max-w-sm text-sm text-text-secondary">
              Plan changes and payments will show up here. During trial, scheduled
              orders appear before Stripe issues an invoice.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {invoices.map((invoice) => {
              const reference =
                invoice.number ?? invoice.id.slice(-8).toUpperCase();

              return (
                <div
                  key={invoice.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedInvoice(invoice)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedInvoice(invoice);
                    }
                  }}
                  className={cn(
                    "group flex flex-col gap-3 rounded-xl border border-border bg-surface/50 p-4 transition-colors",
                    "hover:border-primary/30 hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text-primary">{reference}</p>
                      <Badge variant={statusVariant(invoice.status)}>
                        {formatInvoiceStatus(invoice.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-text-secondary">
                      {invoice.description}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {formatBillingDate(invoice.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 sm:shrink-0">
                    <p className="font-semibold tabular-nums text-text-primary">
                      {formatBillingAmount(
                        invoice.amountPaid || invoice.amountDue,
                        invoice.currency
                      )}
                    </p>
                    <div
                      className="hidden sm:block"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                      role="presentation"
                    >
                      <InvoiceActionButtons
                        invoice={invoice}
                        showLabels={false}
                      />
                    </div>
                    <ChevronRight className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 sm:hidden" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      />
    </>
  );
}

import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/ButtonLink";
import { cn } from "@/lib/utils";

export function InvoiceActionButtons({
  invoice,
  showLabels = true,
  className,
}) {
  const canDownload = Boolean(invoice?.pdfUrl);
  const canView = Boolean(invoice?.hostedUrl);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {canDownload ? (
        <a
          href={invoice.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <FileText className="h-4 w-4" />
          {showLabels ? "Download invoice" : null}
        </a>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <FileText className="h-4 w-4" />
          {showLabels ? "Download invoice" : null}
        </Button>
      )}

      {canView ? (
        <a
          href={invoice.hostedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
        >
          <ExternalLink className="h-4 w-4" />
          {showLabels ? "View invoice" : null}
        </a>
      ) : (
        <Button size="sm" disabled>
          <ExternalLink className="h-4 w-4" />
          {showLabels ? "View invoice" : null}
        </Button>
      )}
    </div>
  );
}

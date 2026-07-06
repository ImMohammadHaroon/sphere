import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-2 rounded-lg border px-4 py-3 shadow-lg sm:bottom-6 sm:right-6",
        toast.variant === "success"
          ? "border-success/30 bg-surface-raised text-text-primary"
          : "border-danger/30 bg-surface-raised text-text-primary"
      )}
      role="status"
    >
      <CheckCircle2
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          toast.variant === "success" ? "text-success" : "text-danger"
        )}
      />
      <p className="flex-1 text-sm">{toast.message}</p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 shrink-0 p-0"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

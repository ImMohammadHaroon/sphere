import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Dialog({ open, onOpenChange, children }) {
  useEffect(() => {
    if (!open) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({ className, children, onClose }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "relative z-10 w-full max-w-lg rounded-lg border border-border bg-surface-raised p-6 shadow-lg",
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {onClose ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Close"
          className="absolute right-3 top-3 h-8 w-8 p-0"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }) {
  return <div className={cn("mb-4 space-y-2 pr-8", className)}>{children}</div>;
}

export function DialogTitle({ className, children }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

export function DialogDescription({ className, children }) {
  return (
    <p className={cn("text-sm text-text-secondary", className)}>{children}</p>
  );
}

export function DialogFooter({ className, children }) {
  return (
    <div className={cn("mt-6 flex flex-wrap justify-end gap-2", className)}>
      {children}
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { getMetricToneButtonClass } from "@/components/ui/MetricCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export function MetricCardDetailDialog({
  open,
  onOpenChange,
  title,
  description,
  viewAllHref,
  onViewAll,
  viewAllLabel = "View all",
  tone,
  isLoading = false,
  isEmpty = false,
  emptyMessage = "No items to show.",
  children,
}) {
  const showViewAll = Boolean(viewAllHref || onViewAll);
  const viewAllButtonClass = getMetricToneButtonClass(tone);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="py-4 text-center text-sm text-text-secondary">
            {emptyMessage}
          </p>
        ) : (
          children
        )}

        {showViewAll && !isLoading ? (
          <DialogFooter>
            {onViewAll ? (
              <Button
                type="button"
                variant={tone ? "ghost" : "outline"}
                size="sm"
                className={cn(tone && viewAllButtonClass)}
                onClick={() => {
                  onOpenChange(false);
                  onViewAll();
                }}
              >
                {viewAllLabel}
              </Button>
            ) : (
              <ButtonLink
                to={viewAllHref}
                variant={tone ? "ghost" : "outline"}
                size="sm"
                className={cn(tone && viewAllButtonClass)}
                onClick={() => onOpenChange(false)}
              >
                {viewAllLabel}
              </ButtonLink>
            )}
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

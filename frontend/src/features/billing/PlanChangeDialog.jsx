import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { PlanSelector } from "./PlanSelector";

export function PlanChangeDialog({
  open,
  onOpenChange,
  plans,
  currentPlan,
  interval,
  onIntervalChange,
  onSelectPlan,
  isLoading,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Change your plan</DialogTitle>
          <DialogDescription>
            Compare plans and switch anytime. Your new limits apply immediately;
            billing updates on your next cycle.
          </DialogDescription>
        </DialogHeader>

        <PlanSelector
          plans={plans}
          currentPlan={currentPlan}
          interval={interval}
          onIntervalChange={onIntervalChange}
          onSelectPlan={(planId) => {
            onSelectPlan(planId);
            onOpenChange(false);
          }}
          isLoading={isLoading}
          compact
        />
      </DialogContent>
    </Dialog>
  );
}

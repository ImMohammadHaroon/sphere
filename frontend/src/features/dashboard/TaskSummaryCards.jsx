import { Card } from "@/components/ui/Card";
import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";

function SummaryCard({ label, value, variant = "default" }) {
  const valueClass =
    variant === "danger"
      ? "text-danger"
      : variant === "success"
        ? "text-success"
        : "text-primary";

  return (
    <Card className="bg-primary-subtle/60 p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold sm:text-3xl ${valueClass}`}>
        {value.toLocaleString()}
      </p>
    </Card>
  );
}

export function TaskSummaryCards() {
  const { taskCounts, dueSoon, overdue } = useDashboardData();

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard label="Total assigned" value={taskCounts.total} />
      <SummaryCard label="Due soon" value={dueSoon.length} />
      <SummaryCard label="Overdue" value={overdue.length} variant="danger" />
      <SummaryCard label="Completed" value={taskCounts.done} variant="success" />
    </div>
  );
}

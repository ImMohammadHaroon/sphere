import { Card } from "@/components/ui/Card";

export function MetricCard({ label, value }) {
  return (
    <Card className="bg-dashboard-accent-subtle p-5">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-dashboard-accent sm:text-3xl">
        {value.toLocaleString()}
      </p>
    </Card>
  );
}

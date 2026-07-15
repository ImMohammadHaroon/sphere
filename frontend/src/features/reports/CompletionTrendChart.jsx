import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Card } from "@/components/ui/Card";

function formatTick(value) {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

export function CompletionTrendChart({
  trend = [],
  title = "Tasks completed (last 30 days)",
  description = "Daily completions across the organization.",
}) {
  const hasData =
    Array.isArray(trend) &&
    trend.some((day) => (day.tasksCompleted ?? 0) > 0);

  if (!hasData) {
    return (
      <Card className="h-full p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
        <div className="mt-6 flex h-64 items-center justify-center">
          <p className="text-sm text-text-secondary">Not enough data yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={trend}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 11 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip
              labelFormatter={(value) => formatTick(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--surface-raised))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--text-primary))",
              }}
              cursor={{ fill: "hsl(var(--primary-subtle))" }}
            />
            <Bar
              dataKey="tasksCompleted"
              name="Completed"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

function ChartEmpty({ title, description }) {
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

export function BurndownChart({
  series = [],
  totalScope = 0,
  title = "Burndown",
  description = "Remaining work versus the ideal path from start to due date.",
}) {
  const hasData = Array.isArray(series) && series.length > 0 && totalScope > 0;

  if (!hasData) {
    return <ChartEmpty title={title} description={description} />;
  }

  return (
    <Card className="h-full p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      <div className="mt-6 h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={formatTick}
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              minTickGap={28}
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
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ideal"
              name="Ideal"
              stroke="hsl(var(--text-muted))"
              strokeDasharray="6 4"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="Actual"
              stroke="hsl(var(--dashboard-accent))"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";

export function OrgGrowthChart({
  series = [],
  title = "Organizations registered",
  description = "New organizations per month over the last six months.",
}) {
  const hasData =
    Array.isArray(series) && series.some((month) => (month.count ?? 0) > 0);

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
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--surface-raised))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                color: "hsl(var(--text-primary))",
              }}
              cursor={{ fill: "hsl(var(--dashboard-accent-subtle))" }}
            />
            <Bar
              dataKey="count"
              name="Organizations"
              fill="hsl(var(--dashboard-accent))"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

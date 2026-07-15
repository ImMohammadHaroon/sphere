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

function formatWeekLabel(weekStart, weekLabel) {
  if (weekLabel) return weekLabel.replace("Week of ", "");
  try {
    return format(parseISO(weekStart), "MMM d");
  } catch {
    return weekStart;
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

export function VelocityChart({
  series = [],
  title = "Velocity",
  description = "Tasks completed per week over the last eight weeks.",
}) {
  const chartData = (series ?? []).map((week) => ({
    ...week,
    label: formatWeekLabel(week.weekStart, week.weekLabel),
  }));

  const hasCompleted = chartData.some((week) => (week.tasksCompleted ?? 0) > 0);

  if (!hasCompleted) {
    return <ChartEmpty title={title} description={description} />;
  }

  return (
    <Card className="h-full p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 11 }}
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
              cursor={{ fill: "hsl(var(--primary-subtle))" }}
            />
            <Bar
              dataKey="tasksCompleted"
              name="Completed"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

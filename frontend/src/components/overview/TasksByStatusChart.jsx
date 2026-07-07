import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
} from "@/lib/taskStatusConfig";

export function TasksByStatusChart({
  tasksByStatus,
  title = "Tasks by status",
  description = "Task distribution across Kanban columns.",
}) {
  const data = Object.keys(TASK_STATUS_LABELS).map((key) => ({
    status: TASK_STATUS_LABELS[key],
    key,
    count: tasksByStatus[key] ?? 0,
  }));

  return (
    <Card className="h-full p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-text-secondary">{description}</p>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="status"
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
              cursor={{ fill: "hsl(var(--primary-subtle))" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.key} fill={TASK_STATUS_COLORS[entry.key]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

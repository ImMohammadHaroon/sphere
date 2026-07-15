import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { getStatusColor } from "@/lib/taskStatusConfig";

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

export function WorkloadChart({
  workload = [],
  title = "Workload",
  description = "Assigned tasks by person, stacked by board column.",
}) {
  const { chartData, columns } = useMemo(() => {
    const rows = workload ?? [];
    const columnDefs = rows[0]?.byColumn ?? [];

    const data = rows.map((row) => {
      const entry = {
        name: row.assigneeName || "Unassigned",
        totalAssigned: row.totalAssigned ?? 0,
      };
      for (const column of row.byColumn ?? []) {
        entry[column.key] = column.count ?? 0;
      }
      return entry;
    });

    return { chartData: data, columns: columnDefs };
  }, [workload]);

  const hasData =
    chartData.length > 0 &&
    chartData.some((row) => (row.totalAssigned ?? 0) > 0);

  if (!hasData) {
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
            layout="vertical"
            margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: "hsl(var(--text-muted))", fontSize: 12 }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tick={{ fill: "hsl(var(--text-secondary))", fontSize: 12 }}
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
            <Legend />
            {columns.map((column) => (
              <Bar
                key={column.key}
                dataKey={column.key}
                name={column.name}
                stackId="workload"
                fill={getStatusColor(columns, column.key)}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

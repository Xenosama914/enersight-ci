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
import { CHART, axisTick } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { fcfa, kwh } from "@/lib/format";

interface Row {
  code: string;
  site: string;
  kwh: number;
  cost: number;
}

export function SiteComparisonChart({
  data,
  metric = "cost",
  highlightCode,
}: {
  data: Row[];
  metric?: "kwh" | "cost";
  highlightCode?: string;
}) {
  const isCost = metric === "cost";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="code" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v: number) =>
            isCost ? `${Math.round(v / 1_000_000)}M` : `${Math.round(v / 1000)}k`
          }
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          content={
            <ChartTooltip
              format={(v) => (isCost ? fcfa(v, { compact: true }) : kwh(v))}
            />
          }
        />
        <Bar dataKey={metric} name={isCost ? "Cout" : "Consommation"} radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((row, i) => (
            <Cell
              key={row.code}
              fill={
                highlightCode && row.code === highlightCode
                  ? CHART.gold
                  : CHART.series[i % CHART.series.length]
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

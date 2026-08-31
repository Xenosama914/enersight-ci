import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, axisTick } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { fcfa, kwh } from "@/lib/format";

interface TrendPoint {
  label: string;
  kwh: number;
  cost: number;
}

export function ConsumptionTrendChart({
  data,
  metric = "kwh",
}: {
  data: TrendPoint[];
  metric?: "kwh" | "cost";
}) {
  const isCost = metric === "cost";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.navy} stopOpacity={0.16} />
            <stop offset="100%" stopColor={CHART.navy} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          width={54}
          tickFormatter={(v: number) =>
            isCost
              ? `${Math.round(v / 1_000_000)}M`
              : `${Math.round(v / 1000)}k`
          }
        />
        <Tooltip
          content={
            <ChartTooltip
              format={(v) => (isCost ? fcfa(v, { compact: true }) : kwh(v))}
            />
          }
        />
        <Area
          type="monotone"
          dataKey={metric}
          name={isCost ? "Cout" : "Consommation"}
          stroke={CHART.navy}
          strokeWidth={2}
          fill="url(#trendFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

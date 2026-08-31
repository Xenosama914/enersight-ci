import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART, axisTick } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";

interface PeakPoint {
  label: string;
  peak: number;
}

/** Pointe mensuelle vs puissance souscrite. Les mois en depassement passent en rouge. */
export function PeakDistributionChart({
  data,
  subscribedKw,
}: {
  data: PeakPoint[];
  subscribedKw: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid stroke={CHART.grid} strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} width={48} />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))" }}
          content={<ChartTooltip format={(v) => `${Math.round(v)} kW`} />}
        />
        <ReferenceLine
          y={subscribedKw}
          stroke={CHART.gold}
          strokeDasharray="4 4"
          label={{ value: "Souscrit", position: "right", fontSize: 10, fill: CHART.gold }}
        />
        <Bar dataKey="peak" name="Pointe" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((d) => (
            <Cell key={d.label} fill={d.peak > subscribedKw ? CHART.neg : CHART.navy} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

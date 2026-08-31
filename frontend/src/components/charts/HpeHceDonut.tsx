import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART } from "@/components/charts/chart-theme";
import { ChartTooltip } from "@/components/charts/ChartTooltip";
import { kwh } from "@/lib/format";

export function HpeHceDonut({ hpe, hce, hpp = 0 }: { hpe: number; hce: number; hpp?: number }) {
  const data = [
    { name: "Heures Pleines", value: hpe, color: CHART.series[0] },
    { name: "Heures Creuses", value: hce, color: CHART.series[2] },
    ...(hpp > 0 ? [{ name: "Heures de Pointe", value: hpp, color: CHART.gold }] : []),
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip format={(v) => kwh(v)} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

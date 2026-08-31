/** Jetons couleur pour Recharts. Voir DESIGN.md section 3.3. */
export const CHART = {
  axis: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  series: [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ],
  navy: "hsl(var(--chart-1))",
  gold: "hsl(var(--gold))",
  pos: "hsl(var(--pos))",
  neg: "hsl(var(--neg))",
  warn: "hsl(var(--warn))",
} as const;

export const axisTick = {
  fontSize: 11,
  fill: CHART.axis,
  fontFamily: "Geist Mono Variable, ui-monospace, monospace",
};

import type { TooltipProps } from "recharts";

type Formatter = (value: number, name: string) => string;

/** Tooltip Recharts stylise comme une card shadcn (DESIGN.md section 3.3). */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
}: TooltipProps<number, string> & { format?: Formatter }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      {label != null ? (
        <p className="mb-1 font-medium text-foreground">{String(label)}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="num ml-auto font-medium text-foreground">
              {format
                ? format(Number(entry.value), String(entry.name))
                : Number(entry.value).toLocaleString("fr-FR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

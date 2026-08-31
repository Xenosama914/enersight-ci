import { ArrowDownRight, ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { signedPct } from "@/lib/format";

/**
 * Variation vs periode precedente. `goodWhenDown` inverse la couleur (utile pour un
 * cout ou une consommation, ou une baisse est favorable).
 */
export function StatDelta({
  value,
  goodWhenDown = false,
  className,
}: {
  value: number | null | undefined;
  goodWhenDown?: boolean;
  className?: string;
}) {
  if (value == null || Number.isNaN(value) || value === 0) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="num">0,0 %</span>
      </span>
    );
  }

  const isUp = value > 0;
  const favorable = goodWhenDown ? !isUp : isUp;
  const Icon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        favorable ? "text-pos" : "text-neg",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" weight="bold" />
      <span className="num">{signedPct(value)}</span>
    </span>
  );
}

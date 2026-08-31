import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  label: string;
  value: string;
  icon: Icon;
  delta?: React.ReactNode;
  hint?: string;
  loading?: boolean;
  /** Met la carte en avant (ex. Economies realisees). DESIGN.md section 4. */
  featured?: boolean;
}

export function KpiCard({
  label,
  value,
  icon: IconCmp,
  delta,
  hint,
  loading,
  featured,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "flex flex-col gap-3 p-4",
        featured && "border-l-2 border-l-gold bg-muted/60",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <IconCmp
          className={cn("h-4 w-4", featured ? "text-gold-strong" : "text-muted-foreground")}
          weight="regular"
        />
      </div>

      {loading ? (
        <Skeleton className="h-7 w-28" />
      ) : (
        <span
          className={cn(
            "num font-semibold leading-none text-foreground",
            featured ? "text-2xl" : "text-xl",
          )}
        >
          {value}
        </span>
      )}

      <div className="flex min-h-[16px] items-center gap-2">
        {loading ? <Skeleton className="h-3 w-20" /> : delta}
        {!loading && hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
    </Card>
  );
}

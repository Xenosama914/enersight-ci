import { kva } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Jauge horizontale actuel vs recommande. Pas de piste de fond epaisse facon dashboard
 * clutter: une barre fine, deux marqueurs, des libelles chiffres.
 */
export function SubscribedPowerGauge({
  currentKva,
  recommendedKva,
  maxKva,
}: {
  currentKva: number;
  recommendedKva: number;
  maxKva?: number;
}) {
  const scaleMax = maxKva ?? Math.max(currentKva, recommendedKva) * 1.15;
  const currentPct = Math.min(100, (currentKva / scaleMax) * 100);
  const recoPct = Math.min(100, (recommendedKva / scaleMax) * 100);
  const reduces = recommendedKva < currentKva;

  return (
    <div className="space-y-4">
      <div className="relative h-2 w-full rounded-full bg-secondary">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            reduces ? "bg-pos" : "bg-primary",
          )}
          style={{ width: `${recoPct}%` }}
        />
        <div
          className="absolute -top-1 h-4 w-0.5 bg-foreground"
          style={{ left: `calc(${currentPct}% - 1px)` }}
          aria-hidden
        />
        <div
          className="absolute -bottom-1 h-4 w-0.5 bg-gold"
          style={{ left: `calc(${recoPct}% - 1px)` }}
          aria-hidden
        />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Souscrit actuel</p>
          <p className="num text-lg font-semibold">{kva(currentKva)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recommande</p>
          <p
            className={cn(
              "num text-lg font-semibold",
              reduces ? "text-pos" : "text-foreground",
            )}
          >
            {kva(recommendedKva)}
          </p>
        </div>
      </div>
    </div>
  );
}

import { SiteSelector } from "@/components/layout/SiteSelector";
import { PeriodSelector } from "@/components/layout/PeriodSelector";

/**
 * Barre d'outils de page: description a gauche, selecteurs a droite.
 * `scope` monte le SiteSelector + PeriodSelector globaux.
 */
export function PageToolbar({
  description,
  scope = false,
  site = false,
  actions,
}: {
  description?: string;
  scope?: boolean;
  site?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {description ? (
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center gap-2">
        {(scope || site) && <SiteSelector />}
        {scope && <PeriodSelector />}
        {actions}
      </div>
    </div>
  );
}

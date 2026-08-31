import type { Icon } from "@phosphor-icons/react";
import { ArrowClockwise, Tray, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/** Etat vide compose (DESIGN.md section 5). */
export function EmptyState({
  icon: IconCmp = Tray,
  title,
  description,
  action,
}: {
  icon?: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-12 text-center">
      <IconCmp className="h-8 w-8 text-muted-foreground" weight="regular" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** Etat d'erreur inline avec relance. */
export function ErrorState({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <WarningCircle className="h-8 w-8 text-destructive" weight="regular" />
      <p className="max-w-sm text-sm text-foreground">
        {message || "Le chargement des donnees a echoue."}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <ArrowClockwise className="h-4 w-4" />
          Reessayer
        </Button>
      ) : null}
    </div>
  );
}

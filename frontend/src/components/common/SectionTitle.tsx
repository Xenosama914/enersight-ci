import { cn } from "@/lib/utils";

/**
 * Titre de section. Eyebrow en petites capitales utilise avec parcimonie
 * (DESIGN.md section 2, skill section 4.7 EYEBROW RESTRAINT).
 */
export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-4", className)}>
      <h2 className="text-sm font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

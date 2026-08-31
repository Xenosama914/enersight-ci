import { cn } from "@/lib/utils";

/**
 * Etat de chargement. `animate-pulse` est une pulsation transitoire de chargement,
 * pas une decoration permanente (DESIGN.md section 6).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

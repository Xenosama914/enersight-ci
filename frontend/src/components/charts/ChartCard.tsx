import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/states";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** hauteur du corps du graphique en px */
  height?: number;
}

export function ChartCard({
  title,
  description,
  loading,
  error,
  onRetry,
  action,
  children,
  height = 260,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-sm">{title}</CardTitle>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <Skeleton style={{ height }} className="w-full" />
        ) : (
          <div style={{ height }}>{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

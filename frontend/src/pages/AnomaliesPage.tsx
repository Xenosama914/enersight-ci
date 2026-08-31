import { useState } from "react";
import { CheckCircle, MagicWand, XCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAnomalies, useScope } from "@/hooks/useEnerSight";
import { api } from "@/lib/api";
import { ANOMALY_TYPE_LABELS } from "@/lib/constants";
import { dateShort, fcfa, pct } from "@/lib/format";
import type { AnomalyStatus } from "@/types";

const STATUS_LABELS: Record<AnomalyStatus, string> = {
  open: "Ouverte",
  acknowledged: "Prise en compte",
  resolved: "Resolue",
  false_positive: "Faux positif",
};

const statusVariant: Record<AnomalyStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  open: "warn",
  acknowledged: "info",
  resolved: "pos",
  false_positive: "muted",
};

export function AnomaliesPage() {
  const { selectedSiteId } = useScope();
  const [severity, setSeverity] = useState("all");
  const [status, setStatus] = useState("all");
  const [running, setRunning] = useState(false);

  const { data, loading, error, reload } = useAnomalies({
    siteId: selectedSiteId,
    severity,
    status,
  });

  async function update(id: string, next: AnomalyStatus) {
    await api.setAnomalyStatus(id, next);
    toast.success(`Anomalie marquee: ${STATUS_LABELS[next].toLowerCase()}`);
    reload();
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Ecarts detectes par le modele Isolation Forest sur les releves. Chaque anomalie est chiffree en perte estimee."
        site
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={async () => {
              setRunning(true);
              const res = await api.runDetection();
              setRunning(false);
              toast.success(`Detection terminee. ${res.found} anomalie(s) ouverte(s).`);
              reload();
            }}
          >
            <MagicWand className="h-4 w-4" />
            {running ? "Analyse..." : "Lancer la detection"}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Severite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes severites</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="open">Ouverte</SelectItem>
            <SelectItem value="acknowledged">Prise en compte</SelectItem>
            <SelectItem value="resolved">Resolue</SelectItem>
            <SelectItem value="false_positive">Faux positif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="Aucune anomalie pour ces filtres"
          description="Ajustez les filtres ou relancez la detection apres un nouvel import."
        />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <SeverityBadge severity={a.severity} />
                        <Badge variant={statusVariant[a.status]}>
                          {STATUS_LABELS[a.status]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {ANOMALY_TYPE_LABELS[a.type]} - {dateShort(a.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      {a.description ? (
                        <p className="max-w-2xl text-sm text-muted-foreground">
                          {a.description}
                        </p>
                      ) : null}
                      {a.deviation_pct != null ? (
                        <p className="num text-xs text-muted-foreground">
                          Ecart {pct(a.deviation_pct)} vs baseline
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Perte estimee</p>
                        <p className="num text-base font-semibold text-neg">
                          {fcfa(a.estimated_loss_fcfa, { compact: true })}
                        </p>
                      </div>
                      {a.status === "open" || a.status === "acknowledged" ? (
                        <div className="flex gap-1.5">
                          {a.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => update(a.id, "acknowledged")}
                            >
                              Prendre en compte
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => update(a.id, "resolved")}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Resoudre
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => update(a.id, "false_positive")}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

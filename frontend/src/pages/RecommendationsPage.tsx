import { useMemo, useState } from "react";
import { CaretDown, CheckCircle, X } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { PriorityBadge } from "@/components/common/SeverityBadge";
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
import { useRecommendations, useScope } from "@/hooks/useEnerSight";
import { api } from "@/lib/api";
import { RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import { fcfa, months } from "@/lib/format";
import type { RecommendationCategory, RecommendationStatus } from "@/types";

export function RecommendationsPage() {
  const { selectedSiteId } = useScope();
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("pending");

  const { data, loading, error, reload } = useRecommendations({
    siteId: selectedSiteId,
    category,
    status,
  });

  const filtered = useMemo(
    () => (data ?? []).filter((r) => priority === "all" || r.priority === priority),
    [data, priority],
  );

  const pendingTotal = useMemo(
    () =>
      filtered
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + r.savings_fcfa_annual, 0),
    [filtered],
  );

  async function setStatusFor(id: string, next: RecommendationStatus) {
    await api.setRecommendationStatus(id, next);
    toast.success(next === "applied" ? "Recommandation appliquee." : "Recommandation ecartee.");
    reload();
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Pistes d'optimisation generees a partir des anomalies et des analyses tarifaires. Chaque piste est chiffree en FCFA et en delai de retour."
        site
      />

      <div className="flex flex-wrap gap-2">
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Priorite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorites</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-8 w-[190px] text-xs">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes categories</SelectItem>
            {(Object.keys(RECOMMENDATION_CATEGORY_LABELS) as RecommendationCategory[]).map(
              (c) => (
                <SelectItem key={c} value={c}>
                  {RECOMMENDATION_CATEGORY_LABELS[c]}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="applied">Appliquee</SelectItem>
            <SelectItem value="dismissed">Ecartee</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {pendingTotal > 0 && (
        <Card className="border-l-2 border-l-gold bg-muted/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Economie annuelle si toutes les pistes en attente sont appliquees
              </p>
              <p className="num text-2xl font-semibold text-pos">{fcfa(pendingTotal)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucune recommandation pour ces filtres"
          description="Ajustez les filtres ci-dessus ou importez de nouveaux releves."
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={r.priority} />
                        <Badge variant="secondary" className="font-normal">
                          {RECOMMENDATION_CATEGORY_LABELS[r.category]}
                        </Badge>
                        {r.status === "applied" && <Badge variant="pos">Appliquee</Badge>}
                        {r.status === "dismissed" && <Badge variant="muted">Ecartee</Badge>}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{r.title}</p>
                      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        {r.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">Economie</p>
                      <p className="num text-base font-semibold text-pos">
                        {fcfa(r.savings_fcfa_monthly, { compact: true })}
                        <span className="text-xs font-normal text-muted-foreground">/mois</span>
                      </p>
                      <p className="num mt-1 text-xs text-muted-foreground">
                        {r.implementation_cost_fcfa > 0
                          ? `Retour ${months(r.payback_months)}`
                          : "Sans investissement"}
                      </p>
                    </div>
                  </div>

                  {r.action_steps.length > 0 && (
                    <details className="group rounded-md border bg-muted/30 px-3 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-medium text-foreground">
                        Plan d'action ({r.action_steps.length} etapes)
                        <CaretDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {r.action_steps.map((s) => (
                          <li key={s.step} className="flex gap-2">
                            <span className="num text-xs text-muted-foreground">{s.step}.</span>
                            <span>{s.text}</span>
                          </li>
                        ))}
                      </ol>
                    </details>
                  )}

                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setStatusFor(r.id, "applied")}>
                        <CheckCircle className="h-4 w-4" />
                        Appliquer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatusFor(r.id, "dismissed")}
                      >
                        <X className="h-4 w-4" />
                        Ecarter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

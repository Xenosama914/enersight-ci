import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Coins,
  Lightning,
  Leaf,
  WarningOctagon,
} from "@phosphor-icons/react";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { KpiCard } from "@/components/common/KpiCard";
import { StatDelta } from "@/components/common/StatDelta";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { ChartCard } from "@/components/charts/ChartCard";
import { ConsumptionTrendChart } from "@/components/charts/ConsumptionTrendChart";
import { SiteComparisonChart } from "@/components/charts/SiteComparisonChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/states";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useAnomalies,
  useConsumptionTrend,
  useKpis,
  useRecommendations,
  useScope,
  useSiteComparison,
} from "@/hooks/useEnerSight";
import { ANOMALY_TYPE_LABELS, RECOMMENDATION_CATEGORY_LABELS } from "@/lib/constants";
import { cosPhi, fcfa, mwh, tonnes } from "@/lib/format";
import { dateShort } from "@/lib/format";

export function DashboardPage() {
  const { selectedSiteId, period } = useScope();
  const [trendMetric, setTrendMetric] = useState<"kwh" | "cost">("kwh");

  const kpis = useKpis(selectedSiteId, period);
  const trend = useConsumptionTrend(selectedSiteId, period);
  const comparison = useSiteComparison(period);
  const anomalies = useAnomalies({ siteId: selectedSiteId, status: "open" });
  const recos = useRecommendations({ siteId: selectedSiteId, status: "pending" });

  const k = kpis.data;

  const worstSiteCode = useMemo(() => {
    if (!comparison.data || comparison.data.length === 0) return undefined;
    return [...comparison.data].sort((a, b) => b.cost - a.cost)[0].code;
  }, [comparison.data]);

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Vue d'ensemble de la consommation, des couts et des economies pour le perimetre selectionne."
        scope
      />

      {/* KPI row: 5 cellules, la 3e (economies) mise en avant. Pas de grille 3 egales. */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Consommation"
          value={mwh(k?.totalConsumptionMwh ?? 0)}
          icon={Lightning}
          loading={kpis.loading}
          delta={<StatDelta value={k?.consumptionChangePct} goodWhenDown />}
        />
        <KpiCard
          label="Cout total"
          value={fcfa(k?.totalCostFcfa ?? 0, { compact: true })}
          icon={Coins}
          loading={kpis.loading}
          delta={<StatDelta value={k?.costChangePct} goodWhenDown />}
        />
        <KpiCard
          label="Economies realisees"
          value={fcfa(k?.savingsRealizedFcfa ?? 0, { compact: true })}
          icon={Coins}
          loading={kpis.loading}
          hint="recommandations appliquees"
          featured
        />
        <KpiCard
          label="Anomalies actives"
          value={String(k?.activeAnomaliesCount ?? 0)}
          icon={WarningOctagon}
          loading={kpis.loading}
          hint="a traiter"
        />
        <KpiCard
          label="Empreinte CO2"
          value={tonnes(k?.co2TonnesEquivalent ?? 0)}
          icon={Leaf}
          loading={kpis.loading}
          hint="reseau + diesel"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartCard
            title="Tendance de consommation"
            description={selectedSiteId === "all" ? "Tous les sites, 12 mois" : "Site selectionne, 12 mois"}
            loading={trend.loading}
            error={trend.error}
            onRetry={trend.reload}
            action={
              <Tabs value={trendMetric} onValueChange={(v) => setTrendMetric(v as "kwh" | "cost")}>
                <TabsList className="h-8">
                  <TabsTrigger value="kwh" className="text-xs">
                    kWh
                  </TabsTrigger>
                  <TabsTrigger value="cost" className="text-xs">
                    FCFA
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            <ConsumptionTrendChart data={trend.data ?? []} metric={trendMetric} />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard
            title="Comparaison par site"
            description="Cout total sur la periode"
            loading={comparison.loading}
            error={comparison.error}
            onRetry={comparison.reload}
          >
            <SiteComparisonChart
              data={comparison.data ?? []}
              metric="cost"
              highlightCode={worstSiteCode}
            />
          </ChartCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Dernieres anomalies</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/anomalies">
                Tout voir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {anomalies.loading ? (
              <ListSkeleton />
            ) : (anomalies.data ?? []).length === 0 ? (
              <EmptyState
                icon={WarningOctagon}
                title="Aucune anomalie ouverte"
                description="Les releves du perimetre selectionne sont dans les normes."
              />
            ) : (
              <ul className="divide-y">
                {(anomalies.data ?? []).slice(0, 5).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-xs text-muted-foreground">
                          {ANOMALY_TYPE_LABELS[a.type]}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateShort(a.created_at)}
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-medium text-neg">
                      {fcfa(a.estimated_loss_fcfa, { compact: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">Recommandations prioritaires</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/recommendations">
                Tout voir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {recos.loading ? (
              <ListSkeleton />
            ) : (recos.data ?? []).length === 0 ? (
              <EmptyState
                title="Aucune recommandation en attente"
                description="Importez de nouveaux releves pour generer des pistes d'optimisation."
              />
            ) : (
              <ul className="divide-y">
                {(recos.data ?? []).slice(0, 3).map((r) => (
                  <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="font-normal">
                          {RECOMMENDATION_CATEGORY_LABELS[r.category]}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm font-medium text-foreground">
                        {r.title}
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-medium text-pos">
                      {fcfa(r.savings_fcfa_monthly, { compact: true })}
                      <span className="text-xs font-normal text-muted-foreground">/mois</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-3 py-3 first:pt-0">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

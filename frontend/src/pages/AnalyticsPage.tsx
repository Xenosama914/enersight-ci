import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { ChartCard } from "@/components/charts/ChartCard";
import { ConsumptionTrendChart } from "@/components/charts/ConsumptionTrendChart";
import { HpeHceDonut } from "@/components/charts/HpeHceDonut";
import { PeakDistributionChart } from "@/components/charts/PeakDistributionChart";
import { SubscribedPowerGauge } from "@/components/charts/SubscribedPowerGauge";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { EmptyState } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAnomalies,
  useConsumptionRecords,
  useConsumptionTrend,
  useScope,
  useSites,
  useSubscribedPowerAnalysis,
  useTimeSlotAnalysis,
} from "@/hooks/useEnerSight";
import { ANOMALY_TYPE_LABELS, MONTH_LABELS } from "@/lib/constants";
import { cosPhi, fcfa, kwh, kva, pct } from "@/lib/format";
import { SEED_YEAR } from "@/data/seed";

export function AnalyticsPage() {
  const { selectedSiteId, period } = useScope();
  const { data: sites } = useSites();
  const [optSiteId, setOptSiteId] = useState<string>("");

  useEffect(() => {
    if (!optSiteId && sites && sites.length > 0) {
      setOptSiteId(selectedSiteId !== "all" ? selectedSiteId : sites[0].id);
    }
  }, [sites, selectedSiteId, optSiteId]);

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Tendances detaillees, anomalies et leviers d'optimisation tarifaire CIE."
        scope
      />

      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">Tendance</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="optimization">Optimisation</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <TrendTab siteId={selectedSiteId} period={period} />
        </TabsContent>

        <TabsContent value="anomalies">
          <AnomaliesTab siteId={selectedSiteId} />
        </TabsContent>

        <TabsContent value="optimization">
          {optSiteId ? (
            <OptimizationTab
              siteId={optSiteId}
              onSiteChange={setOptSiteId}
              sites={(sites ?? []).map((s) => ({ id: s.id, label: `${s.code} - ${s.name}` }))}
            />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TrendTab({ siteId, period }: { siteId: string | "all"; period: import("@/types").Period }) {
  const trend = useConsumptionTrend(siteId, period);
  const records = useConsumptionRecords(siteId, SEED_YEAR);
  const [metric, setMetric] = useState<"kwh" | "cost">("kwh");

  const totals = useMemo(() => {
    const rows = records.data ?? [];
    return {
      hpe: rows.reduce((a, r) => a + r.kwh_hpe, 0),
      hce: rows.reduce((a, r) => a + r.kwh_hce, 0),
      hpp: rows.reduce((a, r) => a + r.kwh_hpp, 0),
    };
  }, [records.data]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard
            title="Consommation et cout"
            loading={trend.loading}
            error={trend.error}
            onRetry={trend.reload}
            action={
              <Tabs value={metric} onValueChange={(v) => setMetric(v as "kwh" | "cost")}>
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
            <ConsumptionTrendChart data={trend.data ?? []} metric={metric} />
          </ChartCard>
        </div>
        <ChartCard
          title="Repartition horaire"
          description="Heures pleines, creuses et pointe"
          loading={records.loading}
          error={records.error}
          onRetry={records.reload}
        >
          <HpeHceDonut hpe={totals.hpe} hce={totals.hce} hpp={totals.hpp} />
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Releves mensuels {SEED_YEAR}</CardTitle>
        </CardHeader>
        <CardContent>
          {records.loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mois</TableHead>
                  <TableHead className="text-right">kWh total</TableHead>
                  <TableHead className="text-right">Pointe kW</TableHead>
                  <TableHead className="text-right">Cos phi</TableHead>
                  <TableHead className="text-right">Facture CIE</TableHead>
                  <TableHead className="text-right">Diesel L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(records.data ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{MONTH_LABELS[r.period_month - 1]}</TableCell>
                    <TableCell className="num text-right">{kwh(r.kwh_total)}</TableCell>
                    <TableCell className="num text-right">{r.peak_power_kw}</TableCell>
                    <TableCell className="num text-right">
                      <span className={r.power_factor < 0.85 ? "text-warn" : undefined}>
                        {cosPhi(r.power_factor)}
                      </span>
                    </TableCell>
                    <TableCell className="num text-right">
                      {fcfa(r.cie_amount_fcfa, { compact: true })}
                    </TableCell>
                    <TableCell className="num text-right">
                      {r.diesel_liters.toLocaleString("fr-FR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnomaliesTab({ siteId }: { siteId: string | "all" }) {
  const { data, loading } = useAnomalies({ siteId });

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Aucune anomalie sur ce perimetre"
        description="Les releves sont dans les normes attendues par le modele."
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">Anomalies detectees</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/anomalies">
            Gerer les anomalies
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="divide-y">
          {data.map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0">
              <SeverityBadge severity={a.severity} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {ANOMALY_TYPE_LABELS[a.type]}
                </p>
              </div>
              <span className="num shrink-0 text-sm text-neg">
                {fcfa(a.estimated_loss_fcfa, { compact: true })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function OptimizationTab({
  siteId,
  onSiteChange,
  sites,
}: {
  siteId: string;
  onSiteChange: (id: string) => void;
  sites: { id: string; label: string }[];
}) {
  const power = useSubscribedPowerAnalysis(siteId);
  const slots = useTimeSlotAnalysis(siteId);
  const records = useConsumptionRecords(siteId, SEED_YEAR);

  const peakData = (records.data ?? []).map((r) => ({
    label: MONTH_LABELS[r.period_month - 1],
    peak: r.peak_power_kw,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Site analyse</span>
        <Select value={siteId} onValueChange={onSiteChange}>
          <SelectTrigger className="h-8 w-[220px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sites.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Puissance souscrite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {power.loading || !power.data ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <>
                <SubscribedPowerGauge
                  currentKva={power.data.current_kva}
                  recommendedKva={power.data.recommended_kva}
                  maxKva={power.data.max_peak_kw / 0.85}
                />
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Info label="Taux d'utilisation" value={pct(power.data.utilization_rate)} />
                  <Info label="Pointe P95" value={`${power.data.p95_peak_kw} kW`} />
                  <Info label="Pointe max" value={`${power.data.max_peak_kw} kW`} />
                  <Info
                    label="Risque de depassement"
                    value={power.data.overshoot_risk === "low" ? "Faible" : "Moyen"}
                  />
                </dl>
                {power.data.recommendation === "reduce" ? (
                  <div className="rounded-md bg-pos/10 px-3 py-2 text-sm text-pos">
                    Reduire a {kva(power.data.recommended_kva)} economiserait{" "}
                    <span className="num font-semibold">
                      {fcfa(power.data.annual_savings_fcfa)}
                    </span>{" "}
                    par an.
                  </div>
                ) : (
                  <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    La puissance souscrite actuelle est adaptee a l'usage.
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <ChartCard
          title="Pointe mensuelle vs souscrit"
          loading={records.loading}
          error={records.error}
          onRetry={records.reload}
        >
          <PeakDistributionChart
            data={peakData}
            subscribedKw={(power.data?.current_kva ?? 0) * 0.9}
          />
        </ChartCard>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Decalage en heures creuses</CardTitle>
        </CardHeader>
        <CardContent>
          {slots.loading || !slots.data ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <Info label="Part en heures pleines" value={pct(slots.data.hpe_ratio)} />
              <Info
                label="Charge decalable / mois"
                value={kwh(slots.data.shiftable_kwh_monthly)}
              />
              <Info
                label="Economie potentielle / mois"
                value={fcfa(slots.data.potential_savings_fcfa_monthly, { compact: true })}
                tone="pos"
              />
              <p className="text-sm text-muted-foreground sm:col-span-3">
                {slots.data.recommendation}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos";
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={"num text-sm font-semibold " + (tone === "pos" ? "text-pos" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}

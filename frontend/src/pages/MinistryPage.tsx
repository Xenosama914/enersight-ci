import { useMemo } from "react";
import { Buildings, Leaf, Lightning, MapPin } from "@phosphor-icons/react";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { KpiCard } from "@/components/common/KpiCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { SiteComparisonChart } from "@/components/charts/SiteComparisonChart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { consumptionRecords, org, sites } from "@/data/seed";
import { co2FromDiesel, co2FromKwh } from "@/lib/calculations";
import { SECTOR_LABELS, SITE_TYPE_LABELS } from "@/lib/constants";
import { cosPhi, fcfa, mwh, tonnes } from "@/lib/format";

export function MinistryPage() {
  const stats = useMemo(() => {
    const kwh = consumptionRecords.reduce((a, r) => a + r.kwh_total, 0);
    const diesel = consumptionRecords.reduce((a, r) => a + r.diesel_liters, 0);
    const pfRows = consumptionRecords.filter((r) => r.power_factor > 0);
    const avgPf = pfRows.reduce((a, r) => a + r.power_factor, 0) / pfRows.length;

    const perSite = sites.map((s) => {
      const rows = consumptionRecords.filter((r) => r.site_id === s.id);
      const siteKwh = rows.reduce((a, r) => a + r.kwh_total, 0);
      const sitePf =
        rows.reduce((a, r) => a + r.power_factor, 0) / Math.max(1, rows.length);
      return {
        site: s,
        kwh: siteKwh,
        cost: rows.reduce((a, r) => a + r.cie_amount_fcfa + r.diesel_cost_fcfa, 0),
        pf: sitePf,
        dieselShare:
          rows.reduce((a, r) => a + r.diesel_liters * 3.5, 0) /
          Math.max(1, siteKwh + rows.reduce((a, r) => a + r.diesel_liters * 3.5, 0)),
      };
    });

    return {
      kwh,
      diesel,
      avgPf,
      co2: co2FromKwh(kwh) + co2FromDiesel(diesel),
      perSite,
    };
  }, []);

  const comparison = stats.perSite.map((p) => ({
    code: p.site.code,
    site: p.site.name,
    kwh: p.kwh,
    cost: p.cost,
  }));

  return (
    <div className="space-y-6">
      <PageToolbar description="Vue agregee du parc energetique industriel suivi. Donnees consolidees, usage regulateur." />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Organisations" value="1" icon={Buildings} hint="sous suivi" />
        <KpiCard label="Sites" value={String(sites.length)} icon={MapPin} />
        <KpiCard
          label="Consommation"
          value={mwh(stats.kwh / 1000)}
          icon={Lightning}
          hint="cumul 12 mois"
        />
        <KpiCard
          label="Emissions CO2"
          value={tonnes(stats.co2)}
          icon={Leaf}
          hint="reseau + diesel"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Consommation par site" description="Cumul 12 mois">
          <SiteComparisonChart data={comparison} metric="kwh" />
        </ChartCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Facteur de puissance moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="num text-3xl font-semibold text-foreground">
              {cosPhi(stats.avgPf)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Seuil reglementaire CIE: 0,85. Un cos phi persistant sous 0,75 declenche une
              alerte de non conformite.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Statut de conformite par site</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Secteur</TableHead>
                <TableHead className="text-right">Consommation</TableHead>
                <TableHead className="text-right">Cos phi moyen</TableHead>
                <TableHead className="text-right">Part diesel</TableHead>
                <TableHead>Conformite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.perSite.map((p) => {
                const compliant = p.pf >= 0.75;
                return (
                  <TableRow key={p.site.id}>
                    <TableCell className="font-medium">
                      {p.site.code} - {p.site.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {SITE_TYPE_LABELS[p.site.type]}
                    </TableCell>
                    <TableCell className="num text-right">{mwh(p.kwh / 1000)}</TableCell>
                    <TableCell className="num text-right">
                      <span className={p.pf < 0.85 ? "text-warn" : undefined}>
                        {cosPhi(p.pf)}
                      </span>
                    </TableCell>
                    <TableCell className="num text-right">
                      {Math.round(p.dieselShare * 100)} %
                    </TableCell>
                    <TableCell>
                      <Badge variant={compliant ? "pos" : "destructive"}>
                        {compliant ? "Conforme" : "Non conforme"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Organisation suivie: {org.name}. Secteur {SECTOR_LABELS[org.sector].toLowerCase()}.
      </p>
    </div>
  );
}

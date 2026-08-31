import { useMemo, useState } from "react";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateROI } from "@/lib/calculations";
import { PLANS } from "@/lib/constants";
import { fcfa, ratio, months, tonnes } from "@/lib/format";
import type { Plan, ROIInputs } from "@/types";

const DEFAULTS: ROIInputs = {
  monthlyBillFcfa: 11_500_000,
  dieselLitersPerMonth: 18_500,
  numSites: 3,
  currentSubscribedKva: 800,
  avgPowerFactor: 0.83,
  planType: "pro",
};

export function RoiCalculatorPage() {
  const [inputs, setInputs] = useState<ROIInputs>(DEFAULTS);
  const results = useMemo(() => calculateROI(inputs), [inputs]);

  function set<K extends keyof ROIInputs>(key: K, value: ROIInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  const num = (key: keyof ROIInputs, label: string, step = "1") => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        type="number"
        step={step}
        className="num"
        value={String(inputs[key])}
        onChange={(e) => set(key, Number(e.target.value) as never)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageToolbar description="Estimez le retour sur investissement d'un abonnement EnerSight CI a partir de vos donnees actuelles. Les hypotheses suivent la methodologie de la specification." />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vos donnees actuelles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {num("monthlyBillFcfa", "Facture CIE mensuelle (FCFA)", "10000")}
            {num("dieselLitersPerMonth", "Diesel mensuel (litres)", "100")}
            {num("numSites", "Nombre de sites")}
            {num("currentSubscribedKva", "Puissance souscrite (kVA)", "5")}
            {num("avgPowerFactor", "Cos phi moyen", "0.01")}
            <div className="space-y-1.5">
              <Label>Formule</Label>
              <Select
                value={inputs.planType}
                onValueChange={(v) => set("planType", v as Plan)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PLANS) as Plan[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PLANS[p].label} - {fcfa(PLANS[p].priceFcfa, { compact: true })}/mois
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-l-2 border-l-gold bg-muted/50">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
              <Metric label="ROI" value={ratio(results.roi_ratio)} tone="pos" />
              <Metric label="Retour sur cout" value={months(results.paybackMonths)} />
              <Metric
                label="Benefice net annuel"
                value={fcfa(results.netAnnualBenefit, { compact: true })}
                tone={results.netAnnualBenefit >= 0 ? "pos" : "neg"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detail des economies mensuelles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y text-sm">
                <Row label="Optimisation tarifaire" value={results.tariffOptimizationSavings} />
                <Row label="Reduction diesel" value={results.dieselReductionSavings} />
                <Row label="Penalites cos phi evitees" value={results.penaltyAvoidanceSavings} />
                <Row label="Total mensuel" value={results.totalMonthlySavings} strong />
                <Row
                  label="Cout abonnement mensuel"
                  value={-results.subscriptionMonthlyCost}
                />
                <Row
                  label="Gain net mensuel"
                  value={results.totalMonthlySavings - results.subscriptionMonthlyCost}
                  strong
                />
              </dl>
              <p className="num mt-4 text-xs text-muted-foreground">
                Impact environnemental estime: {tonnes(results.co2AvoidedTonnesPerYear)} CO2 evitees
                par an.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          "num text-xl font-semibold " +
          (tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-foreground")
        }
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={strong ? "font-medium text-foreground" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd
        className={
          "num " +
          (strong ? "font-semibold text-foreground" : "text-foreground") +
          (value < 0 ? " text-neg" : "")
        }
      >
        {fcfa(value)}
      </dd>
    </div>
  );
}

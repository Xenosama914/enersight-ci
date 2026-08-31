/**
 * Couche d'acces aux donnees. En v1 elle sert les donnees mock de `src/data/seed.ts`.
 * Les signatures sont pensees pour etre remplacees par des appels `fetch` vers l'API
 * FastAPI (SPEC.md section 5) sans changer les composants appelants.
 */
import { changePct, co2FromDiesel, co2FromKwh, percentile } from "@/lib/calculations";
import { PRICE_PER_KVA_MONTH_FCFA, tariffPrice } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import {
  anomalies as seedAnomalies,
  consumptionRecords,
  org,
  recommendations as seedRecommendations,
  reports as seedReports,
  sites as seedSites,
  users,
} from "@/data/seed";
import type {
  Anomaly,
  AnomalyStatus,
  ConsumptionRecord,
  DashboardKPIs,
  Organization,
  Period,
  Recommendation,
  RecommendationStatus,
  Report,
  Site,
  SubscribedPowerAnalysis,
  TimeSlotAnalysis,
  User,
} from "@/types";

const LATENCY = 260;

// Etat mutable en memoire pour simuler les actions (acknowledge, apply, etc.).
let anomalyState: Anomaly[] = seedAnomalies.map((a) => ({ ...a }));
let recommendationState: Recommendation[] = seedRecommendations.map((r) => ({ ...r }));
let reportState: Report[] = seedReports.map((r) => ({ ...r }));

function monthsForPeriod(period: Period): number[] {
  const all = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  switch (period) {
    case "current":
      return [12];
    case "3m":
      return all.slice(-3);
    case "6m":
      return all.slice(-6);
    case "12m":
    default:
      return all;
  }
}

function filterRecords(siteId: string | "all", months: number[]): ConsumptionRecord[] {
  return consumptionRecords.filter(
    (r) => (siteId === "all" || r.site_id === siteId) && months.includes(r.period_month),
  );
}

export const api = {
  async getOrganization(): Promise<Organization> {
    await sleep(LATENCY);
    return org;
  },

  async getUsers(): Promise<User[]> {
    await sleep(LATENCY);
    return users.filter((u) => u.org_id === org.id);
  },

  async getSites(): Promise<Site[]> {
    await sleep(LATENCY);
    return seedSites.filter((s) => s.org_id === org.id);
  },

  async getKpis(siteId: string | "all", period: Period): Promise<DashboardKPIs> {
    await sleep(LATENCY);
    const months = monthsForPeriod(period);
    const current = filterRecords(siteId, months);

    const prevMonths = months.map((m) => m - months.length).filter((m) => m >= 1);
    const previous = filterRecords(siteId, prevMonths);

    const sum = (rows: ConsumptionRecord[], key: keyof ConsumptionRecord) =>
      rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

    const kwhTotal = sum(current, "kwh_total");
    const costTotal = sum(current, "cie_amount_fcfa") + sum(current, "diesel_cost_fcfa");
    const dieselLiters = sum(current, "diesel_liters");

    const prevKwh = sum(previous, "kwh_total");
    const prevCost =
      sum(previous, "cie_amount_fcfa") + sum(previous, "diesel_cost_fcfa");

    const pfRows = current.filter((r) => r.power_factor > 0);
    const avgPf = pfRows.length
      ? pfRows.reduce((acc, r) => acc + r.power_factor, 0) / pfRows.length
      : 0;

    const appliedSavings = recommendationState
      .filter((r) => r.status === "applied")
      .reduce((acc, r) => acc + r.savings_fcfa_monthly, 0);

    const activeAnomalies = anomalyState.filter(
      (a) =>
        (siteId === "all" || a.site_id === siteId) &&
        (a.status === "open" || a.status === "acknowledged"),
    ).length;

    return {
      totalConsumptionMwh: Math.round((kwhTotal / 1000) * 10) / 10,
      totalCostFcfa: Math.round(costTotal),
      savingsRealizedFcfa: appliedSavings * months.length,
      activeAnomaliesCount: activeAnomalies,
      co2TonnesEquivalent:
        Math.round((co2FromKwh(kwhTotal) + co2FromDiesel(dieselLiters)) * 10) / 10,
      dieselLitersTotal: Math.round(dieselLiters),
      avgPowerFactor: Math.round(avgPf * 100) / 100,
      consumptionChangePct: changePct(kwhTotal, prevKwh),
      costChangePct: changePct(costTotal, prevCost),
    };
  },

  async getConsumptionTrend(
    siteId: string | "all",
    period: Period,
  ): Promise<{ month: number; label: string; kwh: number; cost: number; diesel: number }[]> {
    await sleep(LATENCY);
    const months = monthsForPeriod(period === "current" ? "12m" : period);
    const labels = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
    return months.map((m) => {
      const rows = filterRecords(siteId, [m]);
      return {
        month: m,
        label: labels[m - 1],
        kwh: rows.reduce((acc, r) => acc + r.kwh_total, 0),
        cost: rows.reduce((acc, r) => acc + r.cie_amount_fcfa + r.diesel_cost_fcfa, 0),
        diesel: rows.reduce((acc, r) => acc + r.diesel_liters, 0),
      };
    });
  },

  async getSiteComparison(
    period: Period,
  ): Promise<{ site: string; code: string; kwh: number; cost: number }[]> {
    await sleep(LATENCY);
    const months = monthsForPeriod(period);
    return seedSites
      .filter((s) => s.org_id === org.id)
      .map((s) => {
        const rows = filterRecords(s.id, months);
        return {
          site: s.name,
          code: s.code,
          kwh: rows.reduce((acc, r) => acc + r.kwh_total, 0),
          cost: rows.reduce((acc, r) => acc + r.cie_amount_fcfa + r.diesel_cost_fcfa, 0),
        };
      });
  },

  async getConsumptionRecords(
    siteId: string | "all",
    year?: number,
  ): Promise<ConsumptionRecord[]> {
    await sleep(LATENCY);
    return consumptionRecords
      .filter((r) => (siteId === "all" || r.site_id === siteId) && (!year || r.period_year === year))
      .sort((a, b) => a.period_month - b.period_month);
  },

  async getAnomalies(filters: {
    siteId?: string | "all";
    severity?: string;
    status?: string;
  } = {}): Promise<Anomaly[]> {
    await sleep(LATENCY);
    return anomalyState
      .filter((a) => {
        if (filters.siteId && filters.siteId !== "all" && a.site_id !== filters.siteId) return false;
        if (filters.severity && filters.severity !== "all" && a.severity !== filters.severity) return false;
        if (filters.status && filters.status !== "all" && a.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },

  async setAnomalyStatus(id: string, status: AnomalyStatus): Promise<Anomaly> {
    await sleep(LATENCY);
    anomalyState = anomalyState.map((a) => (a.id === id ? { ...a, status } : a));
    return anomalyState.find((a) => a.id === id)!;
  },

  async runDetection(): Promise<{ found: number }> {
    await sleep(900);
    return { found: anomalyState.filter((a) => a.status === "open").length };
  },

  async getRecommendations(filters: {
    siteId?: string | "all";
    category?: string;
    status?: string;
  } = {}): Promise<Recommendation[]> {
    await sleep(LATENCY);
    return recommendationState
      .filter((r) => {
        if (filters.siteId && filters.siteId !== "all" && r.site_id && r.site_id !== filters.siteId)
          return false;
        if (filters.category && filters.category !== "all" && r.category !== filters.category)
          return false;
        if (filters.status && filters.status !== "all" && r.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
        return order[a.priority] - order[b.priority];
      });
  },

  async setRecommendationStatus(
    id: string,
    status: RecommendationStatus,
  ): Promise<Recommendation> {
    await sleep(LATENCY);
    recommendationState = recommendationState.map((r) =>
      r.id === id ? { ...r, status } : r,
    );
    return recommendationState.find((r) => r.id === id)!;
  },

  async getSubscribedPowerAnalysis(siteId: string): Promise<SubscribedPowerAnalysis> {
    await sleep(LATENCY);
    const site = seedSites.find((s) => s.id === siteId)!;
    const rows = consumptionRecords.filter((r) => r.site_id === siteId);
    const peaks = rows.map((r) => r.peak_power_kw);
    const p95 = percentile(peaks, 95);
    const pMax = Math.max(...peaks);
    const pAvg = peaks.reduce((a, b) => a + b, 0) / peaks.length;
    const currentKva = site.subscribed_power_kva;
    const currentKw = currentKva * 0.85;
    const recommendedKw = p95 * 1.1;
    const recommendedKva = Math.max(
      5,
      Math.ceil(recommendedKw / 0.85 / 5) * 5,
    );
    const monthlySavings = (currentKva - recommendedKva) * PRICE_PER_KVA_MONTH_FCFA;
    return {
      site_id: siteId,
      current_kva: currentKva,
      recommended_kva: recommendedKva,
      p95_peak_kw: Math.round(p95 * 10) / 10,
      max_peak_kw: Math.round(pMax * 10) / 10,
      utilization_rate: Math.round((pAvg / currentKw) * 1000) / 10,
      monthly_savings_fcfa: Math.round(monthlySavings),
      annual_savings_fcfa: Math.round(monthlySavings * 12),
      overshoot_risk: recommendedKva > pMax / 0.85 ? "low" : "medium",
      recommendation: monthlySavings > 0 ? "reduce" : "maintain",
    };
  },

  async getTimeSlotAnalysis(siteId: string): Promise<TimeSlotAnalysis> {
    await sleep(LATENCY);
    const site = seedSites.find((s) => s.id === siteId)!;
    const rows = consumptionRecords.filter((r) => r.site_id === siteId).slice(-6);
    const avgHpe = rows.reduce((a, r) => a + r.kwh_hpe, 0) / rows.length;
    const avgHce = rows.reduce((a, r) => a + r.kwh_hce, 0) / rows.length;
    const total = avgHpe + avgHce;
    const hpeRatio = total > 0 ? avgHpe / total : 0;
    const shiftable = Math.max(0, avgHpe - total * 0.5);
    const savingsPerKwh =
      tariffPrice(site.tariff_category, "HPE") - tariffPrice(site.tariff_category, "HCE");
    return {
      site_id: siteId,
      hpe_ratio: Math.round(hpeRatio * 1000) / 10,
      shiftable_kwh_monthly: Math.round(shiftable),
      potential_savings_fcfa_monthly: Math.round(shiftable * savingsPerKwh),
      recommendation: "Decaler les operations non critiques entre 22h et 6h",
    };
  },

  async getReports(): Promise<Report[]> {
    await sleep(LATENCY);
    return [...reportState].sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));
  },

  async generateReport(input: {
    type: Report["type"];
    title: string;
    period_start: string;
    period_end: string;
    sites_included: string[];
  }): Promise<Report> {
    await sleep(700);
    const created: Report = {
      id: `rep-${Date.now()}`,
      org_id: org.id,
      status: "generating",
      generated_at: new Date().toISOString(),
      ...input,
    };
    reportState = [created, ...reportState];
    // Simule la fin de generation.
    setTimeout(() => {
      reportState = reportState.map((r) =>
        r.id === created.id ? { ...r, status: "ready", file_url: "#" } : r,
      );
    }, 2500);
    return created;
  },

  async parseInvoiceOcr(fileName: string): Promise<{
    confidence: number;
    fields: Record<string, string | number>;
  }> {
    await sleep(1400);
    // OCR simule: renvoie des champs pre-remplis plausibles a partir du referentiel MT.
    const kwhHpe = 640_000 + Math.round(Math.random() * 40_000);
    const kwhHce = 360_000 + Math.round(Math.random() * 30_000);
    return {
      confidence: 74 + Math.round(Math.random() * 20),
      fields: {
        invoice_number: `F-${Math.floor(100000 + Math.random() * 899999)}`,
        period: "11/2025 a 11/2025",
        kwh_hpe: kwhHpe,
        kwh_hce: kwhHce,
        kwh_total: kwhHpe + kwhHce,
        peak_power_kw: 612.4,
        power_factor: 0.83,
        subscribed_kva: 800,
        amount_ttc_fcfa: Math.round((kwhHpe * 89.3 + kwhHce * 58.1) * 1.18),
        penalty_fcfa: 1_180_000,
        file_name: fileName,
      },
    };
  },

  async importCsv(rows: Record<string, string>[]): Promise<{ imported: number; skipped: number }> {
    await sleep(800);
    const valid = rows.filter((r) => r.site_code && r.annee && r.mois);
    return { imported: valid.length, skipped: rows.length - valid.length };
  },
};

export type Api = typeof api;

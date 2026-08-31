import {
  DIESEL_CO2_KG_PER_LITER,
  DIESEL_PRICE_FCFA_PER_LITER,
  GRID_CO2_KG_PER_KWH,
  PLANS,
  POWER_FACTOR_THRESHOLD,
} from "@/lib/constants";
import type { ROIInputs, ROIResults } from "@/types";

/** CO2 reseau CIE. SPEC.md Module 1: kwh * 0.6 kg CO2/kWh. */
export function co2FromKwh(kwhTotal: number): number {
  return (kwhTotal * GRID_CO2_KG_PER_KWH) / 1000; // tonnes
}

/** CO2 diesel. SPEC.md Module 1: litres * 2.65 kg CO2/litre. */
export function co2FromDiesel(dieselLiters: number): number {
  return (dieselLiters * DIESEL_CO2_KG_PER_LITER) / 1000; // tonnes
}

/**
 * Penalite cos phi estimee. SPEC.md Module 3 (_estimate_cosphi_penalty):
 * penalite = montant_facture * (0.85 / cos_phi - 1) * 0.5
 */
export function estimateCosPhiPenalty(cieAmountFcfa: number, powerFactor: number): number {
  if (powerFactor >= POWER_FACTOR_THRESHOLD || powerFactor <= 0) return 0;
  const factor = (POWER_FACTOR_THRESHOLD / powerFactor - 1) * 0.5;
  return Math.round(cieAmountFcfa * factor);
}

/**
 * Calculateur ROI. Transcription fidele de SPEC.md section 6 (calculateROI).
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  const subscriptionMonthly = PLANS[inputs.planType].priceFcfa;

  // Optimisation tarifaire: ~12 % de la facture CIE
  const tariffSavings = inputs.monthlyBillFcfa * 0.12;

  // Reduction diesel: ~18 % par meilleure planification
  const dieselSavings = inputs.dieselLitersPerMonth * DIESEL_PRICE_FCFA_PER_LITER * 0.18;

  // Penalites cos phi evitees
  const penaltySavings =
    inputs.avgPowerFactor < POWER_FACTOR_THRESHOLD && inputs.avgPowerFactor > 0
      ? inputs.monthlyBillFcfa * (POWER_FACTOR_THRESHOLD / inputs.avgPowerFactor - 1) * 0.5
      : 0;

  const totalMonthly = tariffSavings + dieselSavings + penaltySavings;
  const totalAnnual = totalMonthly * 12;
  const netAnnual = totalAnnual - subscriptionMonthly * 12;

  return {
    tariffOptimizationSavings: Math.round(tariffSavings),
    dieselReductionSavings: Math.round(dieselSavings),
    penaltyAvoidanceSavings: Math.round(penaltySavings),
    totalMonthlySavings: Math.round(totalMonthly),
    totalAnnualSavings: Math.round(totalAnnual),
    subscriptionMonthlyCost: subscriptionMonthly,
    subscriptionAnnualCost: subscriptionMonthly * 12,
    netAnnualBenefit: Math.round(netAnnual),
    roi_ratio:
      totalAnnual > 0 && subscriptionMonthly > 0
        ? Math.round((totalAnnual / (subscriptionMonthly * 12)) * 10) / 10
        : 0,
    paybackMonths:
      totalMonthly > 0
        ? Math.round((subscriptionMonthly * 12) / totalMonthly)
        : 0,
    co2AvoidedTonnesPerYear: Math.round(
      (inputs.dieselLitersPerMonth * DIESEL_CO2_KG_PER_LITER * 0.18 * 12) / 1000 +
        ((inputs.monthlyBillFcfa / 90) * 0.0006 * 0.12 * 12),
    ),
  };
}

/** Variation en pourcentage entre deux periodes. */
export function changePct(current: number, previous: number): number {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Percentile lineaire simple (methode "R-7", comme numpy.percentile par defaut). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (rank - low) * (sorted[high] - sorted[low]);
}

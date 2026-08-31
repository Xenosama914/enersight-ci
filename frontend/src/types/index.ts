/**
 * Interfaces derivees de SPEC.md sections 3 et 4. Les noms de champs suivent le schema
 * PostgreSQL (snake_case) pour rester alignes avec l'API FastAPI a venir.
 */

export type Sector = "mines" | "petrole" | "industrie" | "tertiaire";
export type Plan = "starter" | "pro" | "enterprise";
export type Role =
  | "admin"
  | "energy_manager"
  | "operator"
  | "viewer"
  | "ministry_auditor";

export type TariffCategory = "BT" | "MT" | "HT";
export type SiteType = "mine_or" | "mine_diamant" | "petrole" | "industrie";

export type AnomalyType =
  | "overconsumption"
  | "power_factor_low"
  | "peak_excess"
  | "diesel_waste"
  | "tariff_penalty";
export type Severity = "low" | "medium" | "high" | "critical";
export type AnomalyStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "false_positive";

export type RecommendationCategory =
  | "tariff_optimization"
  | "power_factor"
  | "diesel_reduction"
  | "peak_shifting"
  | "subscribed_power"
  | "behavior_change";
export type Priority = "low" | "medium" | "high" | "urgent";
export type RecommendationStatus = "pending" | "applied" | "dismissed";

export type OcrStatus = "pending" | "processing" | "done" | "error";
export type DataSource = "manual" | "ocr" | "csv_import" | "api";
export type ReportType =
  | "monthly_summary"
  | "anomaly_report"
  | "roi_report"
  | "ministry_compliance"
  | "custom";
export type ReportStatus = "generating" | "ready" | "error";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: Sector;
  country: string;
  city: string;
  plan: Plan;
  plan_price_fcfa: number;
  max_sites: number;
}

export interface User {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  role: Role;
  avatar_url?: string;
  language: string;
}

export interface Site {
  id: string;
  org_id: string;
  name: string;
  code: string;
  type: SiteType;
  region: string;
  coordinates?: { lat: number; lng: number };
  cie_account_num?: string;
  subscribed_power_kva: number;
  tariff_category: TariffCategory;
  has_diesel: boolean;
  num_generators: number;
  generator_capacity_kva?: number;
  is_active: boolean;
}

export interface ConsumptionRecord {
  id: string;
  site_id: string;
  org_id: string;
  period_year: number;
  period_month: number;
  kwh_hpe: number;
  kwh_hce: number;
  kwh_hpp: number;
  kwh_total: number;
  peak_power_kw: number;
  power_factor: number;
  cie_amount_fcfa: number;
  cie_penalty_fcfa: number;
  cie_invoice_url?: string;
  diesel_liters: number;
  diesel_cost_fcfa: number;
  diesel_hours: number;
  data_source: DataSource;
  ocr_confidence?: number;
}

export interface CieInvoice {
  id: string;
  org_id: string;
  site_id?: string;
  file_url: string;
  file_name: string;
  invoice_number?: string;
  invoice_date?: string;
  period_start?: string;
  period_end?: string;
  kwh_hpe?: number;
  kwh_hce?: number;
  kwh_total?: number;
  peak_power_kw?: number;
  power_factor?: number;
  subscribed_kva?: number;
  amount_ht_fcfa?: number;
  tva_fcfa?: number;
  amount_ttc_fcfa?: number;
  penalty_fcfa?: number;
  ocr_status: OcrStatus;
  ocr_confidence?: number;
  is_validated: boolean;
  created_at: string;
}

export interface Anomaly {
  id: string;
  org_id: string;
  site_id: string;
  consumption_id?: string;
  type: AnomalyType;
  severity: Severity;
  title: string;
  description?: string;
  detected_value?: number;
  expected_value?: number;
  deviation_pct?: number;
  estimated_loss_fcfa: number;
  ml_algorithm: string;
  ml_score?: number;
  status: AnomalyStatus;
  created_at: string;
}

export interface ActionStep {
  step: number;
  text: string;
  effort?: "easy" | "medium" | "hard";
}

export interface Recommendation {
  id: string;
  org_id: string;
  site_id?: string;
  anomaly_id?: string;
  category: RecommendationCategory;
  priority: Priority;
  title: string;
  description: string;
  action_steps: ActionStep[];
  savings_fcfa_monthly: number;
  savings_fcfa_annual: number;
  implementation_cost_fcfa: number;
  payback_months: number;
  status: RecommendationStatus;
  valid_until?: string;
  created_at: string;
}

export interface AlertItem {
  id: string;
  org_id: string;
  site_id?: string;
  type: "anomaly_detected" | "invoice_due" | "report_ready" | "budget_exceeded";
  title: string;
  message?: string;
  severity: "info" | "warning" | "critical";
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  org_id: string;
  type: ReportType;
  title: string;
  period_start?: string;
  period_end?: string;
  sites_included: string[];
  file_url?: string;
  generated_at: string;
  status: ReportStatus;
}

export interface DashboardKPIs {
  totalConsumptionMwh: number;
  totalCostFcfa: number;
  savingsRealizedFcfa: number;
  activeAnomaliesCount: number;
  co2TonnesEquivalent: number;
  dieselLitersTotal: number;
  avgPowerFactor: number;
  consumptionChangePct: number;
  costChangePct: number;
}

export interface SubscribedPowerAnalysis {
  site_id: string;
  current_kva: number;
  recommended_kva: number;
  p95_peak_kw: number;
  max_peak_kw: number;
  utilization_rate: number;
  monthly_savings_fcfa: number;
  annual_savings_fcfa: number;
  overshoot_risk: "low" | "medium";
  recommendation: "reduce" | "maintain";
}

export interface TimeSlotAnalysis {
  site_id: string;
  hpe_ratio: number;
  shiftable_kwh_monthly: number;
  potential_savings_fcfa_monthly: number;
  recommendation: string;
}

export interface ROIInputs {
  monthlyBillFcfa: number;
  dieselLitersPerMonth: number;
  numSites: number;
  currentSubscribedKva: number;
  avgPowerFactor: number;
  planType: Plan;
}

export interface ROIResults {
  tariffOptimizationSavings: number;
  dieselReductionSavings: number;
  penaltyAvoidanceSavings: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  subscriptionMonthlyCost: number;
  subscriptionAnnualCost: number;
  netAnnualBenefit: number;
  roi_ratio: number;
  paybackMonths: number;
  co2AvoidedTonnesPerYear: number;
}

export type Period = "current" | "3m" | "6m" | "12m";

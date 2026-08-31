import type {
  AnomalyType,
  Plan,
  RecommendationCategory,
  Role,
  Sector,
  Severity,
  SiteType,
  TariffCategory,
} from "@/types";

/** Facteurs d'emission. SPEC.md sections 4 (Module 1) et 6. */
export const GRID_CO2_KG_PER_KWH = 0.6;
export const DIESEL_CO2_KG_PER_LITER = 2.65;
export const DIESEL_PRICE_FCFA_PER_LITER = 780;
export const DIESEL_KWH_PER_LITER = 3.5;

/** Prix approx. puissance souscrite, SPEC.md Module 4. */
export const PRICE_PER_KVA_MONTH_FCFA = 3500;

/** Seuil de penalite cos phi CIE. */
export const POWER_FACTOR_THRESHOLD = 0.85;

/** Tarifs CIE de reference 2025-2026. SPEC.md section 3.1 (table cie_tariffs). */
export interface CieTariff {
  category: TariffCategory;
  time_slot: "HPE" | "HCE" | "HPP";
  price_fcfa_kwh: number;
  valid_from: string;
  source?: string;
}

export const CIE_TARIFFS: CieTariff[] = [
  { category: "BT", time_slot: "HPE", price_fcfa_kwh: 105.2, valid_from: "2025-01-01" },
  { category: "BT", time_slot: "HCE", price_fcfa_kwh: 72.5, valid_from: "2025-01-01" },
  { category: "MT", time_slot: "HPE", price_fcfa_kwh: 89.3, valid_from: "2025-01-01" },
  { category: "MT", time_slot: "HCE", price_fcfa_kwh: 58.1, valid_from: "2025-01-01" },
  { category: "MT", time_slot: "HPP", price_fcfa_kwh: 145.8, valid_from: "2025-01-01" },
  { category: "HT", time_slot: "HPE", price_fcfa_kwh: 74.2, valid_from: "2025-01-01" },
  { category: "HT", time_slot: "HCE", price_fcfa_kwh: 48.6, valid_from: "2025-01-01" },
  { category: "HT", time_slot: "HPP", price_fcfa_kwh: 128.4, valid_from: "2025-01-01" },
];

export function tariffPrice(category: TariffCategory, slot: "HPE" | "HCE" | "HPP") {
  return CIE_TARIFFS.find((t) => t.category === category && t.time_slot === slot)?.price_fcfa_kwh ?? 0;
}

/** Plans SaaS. SPEC.md section 9.1. */
export const PLANS: Record<Plan, { label: string; priceFcfa: number; sites: string; users: string }> = {
  starter: { label: "Starter", priceFcfa: 150_000, sites: "1 a 3", users: "5" },
  pro: { label: "Pro", priceFcfa: 400_000, sites: "4 a 10", users: "20" },
  enterprise: { label: "Enterprise", priceFcfa: 800_000, sites: "Illimite", users: "Illimite" },
};

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrateur",
  energy_manager: "Responsable energie",
  operator: "Operateur",
  viewer: "Lecteur",
  ministry_auditor: "Auditeur Ministere",
};

export const SECTOR_LABELS: Record<Sector, string> = {
  mines: "Mines",
  petrole: "Petrole",
  industrie: "Industrie",
  tertiaire: "Tertiaire",
};

export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  mine_or: "Mine d'or",
  mine_diamant: "Mine de diamant",
  petrole: "Site petrolier",
  industrie: "Site industriel",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Haute",
  critical: "Critique",
};

export const ANOMALY_TYPE_LABELS: Record<AnomalyType, string> = {
  overconsumption: "Surconsommation",
  power_factor_low: "Cos phi insuffisant",
  peak_excess: "Depassement de pointe",
  diesel_waste: "Surconsommation diesel",
  tariff_penalty: "Penalite tarifaire",
};

export const RECOMMENDATION_CATEGORY_LABELS: Record<RecommendationCategory, string> = {
  tariff_optimization: "Optimisation tarifaire",
  power_factor: "Facteur de puissance",
  diesel_reduction: "Reduction diesel",
  peak_shifting: "Decalage de pointe",
  subscribed_power: "Puissance souscrite",
  behavior_change: "Changement de pratique",
};

export const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aout", "Sep", "Oct", "Nov", "Dec",
];

/** Roles autorises par route. SPEC.md section 6.2. */
export const ROUTE_ROLES: Record<string, Role[] | "all"> = {
  "/dashboard": "all",
  "/analytics": ["admin", "energy_manager", "operator", "viewer"],
  "/import": ["admin", "energy_manager", "operator"],
  "/sites": ["admin", "energy_manager", "operator", "viewer"],
  "/recommendations": "all",
  "/roi-calculator": "all",
  "/reports": "all",
  "/settings": ["admin", "energy_manager", "operator", "viewer"],
  "/ministry": ["ministry_auditor"],
};

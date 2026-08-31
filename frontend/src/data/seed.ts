/**
 * Donnees de demonstration. Base sur SPEC.md section 8 (organisation SODEMI, 3 sites,
 * 12 mois de consommation 2025).
 *
 * Note d'echelle: le tableau `monthly_kwh` de la SPEC est interprete en MWh (megawatt-heures).
 * kwh_total est donc `valeur * 1000`. Les puissances de pointe sont derivees de la puissance
 * souscrite avec un taux d'utilisation cible et un bruit mensuel deterministe, plus quelques
 * mois de depassement pour alimenter la detection d'anomalies. Les montants CIE sont recalcules
 * depuis le referentiel tarifaire (SPEC.md section 3.1).
 */
import {
  DIESEL_PRICE_FCFA_PER_LITER,
  tariffPrice,
} from "@/lib/constants";
import { estimateCosPhiPenalty } from "@/lib/calculations";
import type {
  Anomaly,
  ConsumptionRecord,
  Organization,
  Recommendation,
  Report,
  Site,
  User,
} from "@/types";

export const SEED_YEAR = 2025;

export const org: Organization = {
  id: "org-sodemi",
  name: "SODEMI Extraction SA",
  slug: "sodemi-extraction",
  sector: "mines",
  country: "CI",
  city: "Abidjan",
  plan: "pro",
  plan_price_fcfa: 400_000,
  max_sites: 10,
};

export const ministryOrg: Organization = {
  id: "org-ministere",
  name: "Ministere des Mines, du Petrole et de l'Energie",
  slug: "ministere-mpe",
  sector: "tertiaire",
  country: "CI",
  city: "Abidjan",
  plan: "enterprise",
  plan_price_fcfa: 0,
  max_sites: 0,
};

export const users: User[] = [
  {
    id: "usr-aka",
    org_id: org.id,
    full_name: "Koffi Aka",
    email: "koffi.aka@sodemi.ci",
    role: "admin",
    language: "fr",
  },
  {
    id: "usr-traore",
    org_id: org.id,
    full_name: "Aminata Traore",
    email: "aminata.traore@sodemi.ci",
    role: "energy_manager",
    language: "fr",
  },
  {
    id: "usr-nguessan",
    org_id: org.id,
    full_name: "Yao N'Guessan",
    email: "yao.nguessan@sodemi.ci",
    role: "operator",
    language: "fr",
  },
  {
    id: "usr-bamba",
    org_id: org.id,
    full_name: "Fatou Bamba",
    email: "fatou.bamba@sodemi.ci",
    role: "viewer",
    language: "fr",
  },
  {
    id: "usr-coulibaly",
    org_id: ministryOrg.id,
    full_name: "Ibrahim Coulibaly",
    email: "i.coulibaly@energie.gouv.ci",
    role: "ministry_auditor",
    language: "fr",
  },
];

export const sites: Site[] = [
  {
    id: "site-tor",
    org_id: org.id,
    name: "Mine Tortiya (Diamants)",
    code: "TOR-01",
    type: "mine_diamant",
    region: "Hambol",
    coordinates: { lat: 8.16, lng: -5.47 },
    cie_account_num: "CIE-MT-448120",
    subscribed_power_kva: 800,
    tariff_category: "MT",
    has_diesel: true,
    num_generators: 3,
    generator_capacity_kva: 900,
    is_active: true,
  },
  {
    id: "site-iss",
    org_id: org.id,
    name: "Mine Issia Gold",
    code: "ISS-01",
    type: "mine_or",
    region: "Haut-Sassandra",
    coordinates: { lat: 6.49, lng: -6.58 },
    cie_account_num: "CIE-MT-451003",
    subscribed_power_kva: 600,
    tariff_category: "MT",
    has_diesel: true,
    num_generators: 2,
    generator_capacity_kva: 550,
    is_active: true,
  },
  {
    id: "site-div",
    org_id: org.id,
    name: "Divo Petro",
    code: "DIV-01",
    type: "petrole",
    region: "Loh-Djiboua",
    coordinates: { lat: 5.84, lng: -5.36 },
    cie_account_num: "CIE-BT-330847",
    subscribed_power_kva: 400,
    tariff_category: "BT",
    has_diesel: true,
    num_generators: 2,
    generator_capacity_kva: 320,
    is_active: true,
  },
];

interface SiteProfile {
  siteId: string;
  monthlyMwh: number[];
  powerFactor: number;
  hpeRatio: number;
  hppRatio: number;
  utilizationTarget: number;
  avgDieselLiters: number;
  peakOvershootMonths: number[]; // mois (1-12) ou la pointe depasse la puissance souscrite
  consumptionSpikeMonths: number[]; // mois avec surconsommation marquee
}

const profiles: SiteProfile[] = [
  {
    siteId: "site-tor",
    monthlyMwh: [1050, 980, 1120, 1180, 1240, 1310, 1250, 1190, 1214, 1160, 1090, 1020],
    powerFactor: 0.83,
    hpeRatio: 0.66,
    hppRatio: 0.08,
    utilizationTarget: 0.74,
    avgDieselLiters: 18500,
    peakOvershootMonths: [6],
    consumptionSpikeMonths: [7],
  },
  {
    siteId: "site-iss",
    monthlyMwh: [780, 810, 845, 870, 892, 910, 895, 876, 890, 870, 840, 810],
    powerFactor: 0.88,
    hpeRatio: 0.58,
    hppRatio: 0.06,
    utilizationTarget: 0.55,
    avgDieselLiters: 12200,
    peakOvershootMonths: [9],
    consumptionSpikeMonths: [9],
  },
  {
    siteId: "site-div",
    monthlyMwh: [680, 720, 745, 757, 775, 790, 770, 757, 760, 745, 720, 690],
    powerFactor: 0.91,
    hpeRatio: 0.52,
    hppRatio: 0,
    utilizationTarget: 0.6,
    avgDieselLiters: 8400,
    peakOvershootMonths: [],
    consumptionSpikeMonths: [],
  },
];

/** Bruit deterministe reproductible (pas de Math.random pour un rendu stable). */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

function buildConsumption(): ConsumptionRecord[] {
  const records: ConsumptionRecord[] = [];

  for (const profile of profiles) {
    const site = sites.find((s) => s.id === profile.siteId)!;
    const subscribedKw = site.subscribed_power_kva * 0.9;

    profile.monthlyMwh.forEach((mwh, idx) => {
      const month = idx + 1;
      const n = noise(idx + profile.siteId.length * 7);

      const spike = profile.consumptionSpikeMonths.includes(month) ? 1.28 : 1;
      const kwhTotal = Math.round(mwh * 1000 * spike);

      const hpp = profile.hppRatio > 0 ? Math.round(kwhTotal * profile.hppRatio) : 0;
      const kwhHpe = Math.round((kwhTotal - hpp) * profile.hpeRatio);
      const kwhHce = kwhTotal - hpp - kwhHpe;

      let peak = subscribedKw * profile.utilizationTarget * (0.94 + n * 0.14);
      if (profile.peakOvershootMonths.includes(month)) {
        peak = subscribedKw * (1.05 + n * 0.06);
      }
      peak = Math.round(peak * 10) / 10;

      const pf =
        Math.round(
          (profile.powerFactor + (n - 0.5) * 0.03 - (spike > 1 ? 0.02 : 0)) * 100,
        ) / 100;

      const priceHpe = tariffPrice(site.tariff_category, "HPE");
      const priceHce = tariffPrice(site.tariff_category, "HCE");
      const priceHpp = tariffPrice(site.tariff_category, "HPP");
      const energyCost = kwhHpe * priceHpe + kwhHce * priceHce + hpp * priceHpp;
      const penalty = estimateCosPhiPenalty(Math.round(energyCost), pf);
      const cieAmount = Math.round(energyCost + penalty);

      const dieselLiters = Math.round(
        profile.avgDieselLiters * (0.85 + n * 0.3) * (month === 4 && site.id === "site-tor" ? 1.34 : 1),
      );

      records.push({
        id: `cons-${site.code}-${SEED_YEAR}-${String(month).padStart(2, "0")}`,
        site_id: site.id,
        org_id: org.id,
        period_year: SEED_YEAR,
        period_month: month,
        kwh_hpe: kwhHpe,
        kwh_hce: kwhHce,
        kwh_hpp: hpp,
        kwh_total: kwhTotal,
        peak_power_kw: peak,
        power_factor: pf,
        cie_amount_fcfa: cieAmount,
        cie_penalty_fcfa: penalty,
        cie_invoice_url: undefined,
        diesel_liters: dieselLiters,
        diesel_cost_fcfa: Math.round(dieselLiters * DIESEL_PRICE_FCFA_PER_LITER),
        diesel_hours: Math.round(dieselLiters / 45),
        data_source: idx % 4 === 0 ? "ocr" : idx % 3 === 0 ? "csv_import" : "manual",
        ocr_confidence: idx % 4 === 0 ? 82 + Math.round(n * 12) : undefined,
      });
    });
  }

  return records;
}

export const consumptionRecords: ConsumptionRecord[] = buildConsumption();

function recFor(siteId: string, month: number) {
  return consumptionRecords.find(
    (r) => r.site_id === siteId && r.period_month === month,
  )!;
}

const torPfRecord = recFor("site-tor", 2);
const torSpikeRecord = recFor("site-tor", 7);
const torDieselRecord = recFor("site-tor", 4);
const issSpikeRecord = recFor("site-iss", 9);

export const anomalies: Anomaly[] = [
  {
    id: "ano-tor-pf",
    org_id: org.id,
    site_id: "site-tor",
    consumption_id: torPfRecord.id,
    type: "power_factor_low",
    severity: torPfRecord.power_factor < 0.8 ? "high" : "medium",
    title: `Cos phi insuffisant : ${torPfRecord.power_factor.toFixed(2)} (seuil CIE : 0.85)`,
    description:
      "Le facteur de puissance de la Mine Tortiya reste sous le seuil CIE depuis trois releves consecutifs. CIE applique une penalite proportionnelle sur chaque facture concernee.",
    detected_value: torPfRecord.power_factor,
    expected_value: 0.85,
    deviation_pct: Math.round((0.85 / torPfRecord.power_factor - 1) * 1000) / 10,
    estimated_loss_fcfa: torPfRecord.cie_penalty_fcfa,
    ml_algorithm: "isolation_forest",
    ml_score: -0.42,
    status: "open",
    created_at: `${SEED_YEAR}-02-08T09:12:00Z`,
  },
  {
    id: "ano-tor-over",
    org_id: org.id,
    site_id: "site-tor",
    consumption_id: torSpikeRecord.id,
    type: "overconsumption",
    severity: "high",
    title: "Surconsommation de 28 % vs moyenne 12 mois",
    description:
      "Le releve de juillet depasse nettement la baseline de la Mine Tortiya. A verifier: campagne d'extraction prolongee ou fuite de charge non pilotee.",
    detected_value: torSpikeRecord.kwh_total,
    expected_value: Math.round(torSpikeRecord.kwh_total / 1.28),
    deviation_pct: 28,
    estimated_loss_fcfa: Math.round(torSpikeRecord.kwh_total * 0.2 * 90),
    ml_algorithm: "isolation_forest",
    ml_score: -0.55,
    status: "open",
    created_at: `${SEED_YEAR}-07-06T14:03:00Z`,
  },
  {
    id: "ano-tor-diesel",
    org_id: org.id,
    site_id: "site-tor",
    consumption_id: torDieselRecord.id,
    type: "diesel_waste",
    severity: "medium",
    title: "Surconsommation diesel : +34 % vs moyenne",
    description:
      "Les groupes electrogenes de Tortiya ont tourne plus que d'habitude en avril, sans hausse equivalente de la charge utile.",
    detected_value: torDieselRecord.diesel_liters,
    expected_value: 18500,
    deviation_pct: 34,
    estimated_loss_fcfa: Math.round((torDieselRecord.diesel_liters - 18500) * DIESEL_PRICE_FCFA_PER_LITER),
    ml_algorithm: "isolation_forest",
    ml_score: -0.31,
    status: "acknowledged",
    created_at: `${SEED_YEAR}-04-05T08:40:00Z`,
  },
  {
    id: "ano-iss-peak",
    org_id: org.id,
    site_id: "site-iss",
    consumption_id: issSpikeRecord.id,
    type: "peak_excess",
    severity: "high",
    title: "Depassement de puissance souscrite en septembre",
    description:
      "La pointe relevee sur Issia Gold depasse la puissance souscrite. CIE facture le depassement au triple du prix de la puissance concernee.",
    detected_value: issSpikeRecord.peak_power_kw,
    expected_value: 600 * 0.9,
    deviation_pct:
      Math.round(((issSpikeRecord.peak_power_kw - 600 * 0.9) / (600 * 0.9)) * 1000) / 10,
    estimated_loss_fcfa: 2_450_000,
    ml_algorithm: "isolation_forest",
    ml_score: -0.48,
    status: "open",
    created_at: `${SEED_YEAR}-09-04T11:20:00Z`,
  },
  {
    id: "ano-iss-over",
    org_id: org.id,
    site_id: "site-iss",
    consumption_id: issSpikeRecord.id,
    type: "overconsumption",
    severity: "medium",
    title: "Surconsommation de 26 % vs moyenne 12 mois",
    description:
      "Hausse simultanee de la consommation et de la pointe sur Issia Gold en septembre.",
    detected_value: issSpikeRecord.kwh_total,
    expected_value: Math.round(issSpikeRecord.kwh_total / 1.26),
    deviation_pct: 26,
    estimated_loss_fcfa: Math.round(issSpikeRecord.kwh_total * 0.2 * 75),
    ml_algorithm: "isolation_forest",
    ml_score: -0.37,
    status: "open",
    created_at: `${SEED_YEAR}-09-04T11:22:00Z`,
  },
];

const torAnnualPenalty = consumptionRecords
  .filter((r) => r.site_id === "site-tor")
  .reduce((sum, r) => sum + r.cie_penalty_fcfa, 0);

export const recommendations: Recommendation[] = [
  {
    id: "rec-tor-pf",
    org_id: org.id,
    site_id: "site-tor",
    anomaly_id: "ano-tor-pf",
    category: "power_factor",
    priority: "urgent",
    title: "Installer une batterie de condensateurs automatique",
    description: `Le cos phi moyen de la Mine Tortiya est de 0,83. CIE applique une penalite des que cos phi < 0,85. Une batterie de condensateurs automatique corrige le facteur de puissance et supprime la quasi-totalite de ces penalites, soit environ ${Math.round(torAnnualPenalty * 0.9).toLocaleString("fr-FR")} FCFA par an.`,
    action_steps: [
      { step: 1, text: "Demander un audit electrique sur site", effort: "easy" },
      { step: 2, text: "Dimensionner la batterie de condensateurs (environ 180 kVAr)", effort: "medium" },
      { step: 3, text: "Installer et parametrer le regulateur automatique", effort: "medium" },
      { step: 4, text: "Verifier la correction sur 3 factures CIE consecutives", effort: "easy" },
    ],
    savings_fcfa_monthly: Math.round((torAnnualPenalty * 0.9) / 12),
    savings_fcfa_annual: Math.round(torAnnualPenalty * 0.9),
    implementation_cost_fcfa: 7_500_000,
    payback_months: Math.max(1, Math.round(7_500_000 / Math.max(1, (torAnnualPenalty * 0.9) / 12))),
    status: "pending",
    valid_until: `${SEED_YEAR + 1}-06-30`,
    created_at: `${SEED_YEAR}-02-10T10:00:00Z`,
  },
  {
    id: "rec-iss-power",
    org_id: org.id,
    site_id: "site-iss",
    category: "subscribed_power",
    priority: "high",
    title: "Reduire la puissance souscrite CIE de Issia Gold",
    description:
      "Issia Gold n'utilise que 55 % de sa puissance souscrite (600 kVA). En la ramenant a 480 kVA, la marge de securite reste suffisante face au 95e percentile de pointe et la facture de puissance baisse chaque mois.",
    action_steps: [
      { step: 1, text: "Confirmer le 95e percentile de pointe sur 12 mois", effort: "easy" },
      { step: 2, text: "Deposer une demande de revision de puissance aupres de CIE", effort: "medium" },
      { step: 3, text: "Suivre la premiere facture apres bascule", effort: "easy" },
    ],
    savings_fcfa_monthly: (600 - 480) * 3500,
    savings_fcfa_annual: (600 - 480) * 3500 * 12,
    implementation_cost_fcfa: 0,
    payback_months: 0,
    status: "pending",
    valid_until: `${SEED_YEAR + 1}-03-31`,
    created_at: `${SEED_YEAR}-03-15T09:30:00Z`,
  },
  {
    id: "rec-tor-shift",
    org_id: org.id,
    site_id: "site-tor",
    category: "peak_shifting",
    priority: "medium",
    title: "Decaler les operations non critiques en heures creuses",
    description:
      "66 % de la consommation de Tortiya se fait en Heures Pleines (89,3 FCFA/kWh). En decalant le concassage et le pompage non critiques vers les Heures Creuses (58,1 FCFA/kWh) entre 22h et 6h, l'economie est immediate et sans investissement.",
    action_steps: [
      { step: 1, text: "Identifier les postes decalables (concassage, pompage, ventilation secondaire)", effort: "medium" },
      { step: 2, text: "Reprogrammer les automates sur la plage 22h - 6h", effort: "medium" },
      { step: 3, text: "Mesurer le nouveau ratio HPE/HCE sur 2 factures", effort: "easy" },
    ],
    savings_fcfa_monthly: 3_100_000,
    savings_fcfa_annual: 37_200_000,
    implementation_cost_fcfa: 1_200_000,
    payback_months: 1,
    status: "pending",
    created_at: `${SEED_YEAR}-05-02T08:00:00Z`,
  },
  {
    id: "rec-tor-diesel",
    org_id: org.id,
    site_id: "site-tor",
    category: "diesel_reduction",
    priority: "medium",
    title: "Optimiser le planning des groupes electrogenes",
    description:
      "Les groupes de Tortiya consomment en moyenne 18 500 L par mois. Une meilleure synchronisation avec les coupures CIE previsibles et un pilotage par charge reduisent cette consommation de 15 a 20 %.",
    action_steps: [
      { step: 1, text: "Historiser les creneaux de coupure CIE des 6 derniers mois", effort: "easy" },
      { step: 2, text: "Definir un ordre de demarrage par palier de charge", effort: "medium" },
      { step: 3, text: "Former les operateurs au nouveau protocole", effort: "easy" },
    ],
    savings_fcfa_monthly: Math.round(18500 * DIESEL_PRICE_FCFA_PER_LITER * 0.17),
    savings_fcfa_annual: Math.round(18500 * DIESEL_PRICE_FCFA_PER_LITER * 0.17 * 12),
    implementation_cost_fcfa: 900_000,
    payback_months: 1,
    status: "applied",
    created_at: `${SEED_YEAR}-04-12T09:00:00Z`,
  },
  {
    id: "rec-org-tariff",
    org_id: org.id,
    category: "tariff_optimization",
    priority: "high",
    title: "Renegocier la structure tarifaire multi-sites",
    description:
      "Les trois sites SODEMI sont factures independamment. Un contrat cadre multi-sites en Moyenne Tension permet d'aligner Divo Petro sur un tarif MT et de lisser les pointes a l'echelle du parc.",
    action_steps: [
      { step: 1, text: "Consolider les 12 derniers mois de factures des 3 sites", effort: "medium" },
      { step: 2, text: "Simuler le passage de Divo Petro en MT", effort: "medium" },
      { step: 3, text: "Ouvrir la discussion contractuelle avec CIE Grands Comptes", effort: "hard" },
    ],
    savings_fcfa_monthly: 4_800_000,
    savings_fcfa_annual: 57_600_000,
    implementation_cost_fcfa: 0,
    payback_months: 0,
    status: "pending",
    created_at: `${SEED_YEAR}-06-01T10:00:00Z`,
  },
];

export const reports: Report[] = [
  {
    id: "rep-2025-06",
    org_id: org.id,
    type: "monthly_summary",
    title: "Synthese mensuelle - juin 2025",
    period_start: `${SEED_YEAR}-06-01`,
    period_end: `${SEED_YEAR}-06-30`,
    sites_included: sites.map((s) => s.id),
    file_url: "#",
    generated_at: `${SEED_YEAR}-07-02T06:15:00Z`,
    status: "ready",
  },
  {
    id: "rep-roi-s1",
    org_id: org.id,
    type: "roi_report",
    title: "Rapport ROI - 1er semestre 2025",
    period_start: `${SEED_YEAR}-01-01`,
    period_end: `${SEED_YEAR}-06-30`,
    sites_included: sites.map((s) => s.id),
    file_url: "#",
    generated_at: `${SEED_YEAR}-07-10T09:00:00Z`,
    status: "ready",
  },
  {
    id: "rep-compliance-q2",
    org_id: org.id,
    type: "ministry_compliance",
    title: "Rapport de conformite - T2 2025",
    period_start: `${SEED_YEAR}-04-01`,
    period_end: `${SEED_YEAR}-06-30`,
    sites_included: sites.map((s) => s.id),
    generated_at: `${SEED_YEAR}-07-15T14:00:00Z`,
    status: "generating",
  },
];

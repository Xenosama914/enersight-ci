# EnerSight CI — Spécifications Complètes SaaS
## Document de référence pour le développement (Claude Code)

> **Version** : 1.0 — 31 Août 2026  
> **Contexte** : SIREXE Hackathon 2026 — Thématique : Optimisation de la consommation énergétique  
> **Contact** : alexandrekouakou45@gmail.com

---

## 1. VISION DU PRODUIT

**EnerSight CI** est une plateforme SaaS d'intelligence énergétique pour les industries extractives et industrielles de Côte d'Ivoire. Elle transforme les données existantes (factures CIE, logs diesel, relevés CSV) en recommandations d'optimisation chiffrées en FCFA — **sans capteur, sans matériel IoT**.

### Proposition de valeur
- Réduction de 15–25% des coûts énergétiques dès le 1er mois
- ROI 4:1 à 9:1 sur abonnement annuel
- Déployable en 48 heures, formation en 2 heures
- 100% cloud, zéro infrastructure physique côté client

### Marché cible
1. **Primaire** : Entreprises extractives (mines, pétrole) — sites multi-localisés en CI
2. **Secondaire** : Industries manufacturières, PME tertiaires à fort poste énergie
3. **Tertiaire** : Ministère des Mines, du Pétrole et de l'Énergie (vue régulateur)

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Stack technologique

| Couche | Technologie | Version | Rôle |
|--------|-------------|---------|------|
| **Frontend** | React + Vite | React 18 / Vite 5 | SPA web responsive |
| **UI Components** | Tailwind CSS + shadcn/ui | Tailwind 3.4 | Design system |
| **Charts** | Recharts | 2.x | Visualisations données |
| **Backend** | FastAPI (Python) | FastAPI 0.110 | API REST + WebSocket |
| **Base de données** | PostgreSQL via Supabase | PG 15 | Données structurées |
| **Auth** | Supabase Auth | — | JWT + OAuth Google |
| **ML / IA** | scikit-learn + pandas | sklearn 1.4 | Détection anomalies |
| **OCR** | Tesseract + OpenCV | Tess 5.x | Lecture factures CIE |
| **File Storage** | Supabase Storage | — | PDF, CSV, images |
| **Déploiement Frontend** | Vercel | — | CDN mondial |
| **Déploiement Backend** | Railway | — | Container Python |
| **CI/CD** | GitHub Actions | — | Tests + deploy auto |

### 2.2 Architecture système

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│          React + Vite SPA  ─  Tailwind CSS  ─  Recharts         │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS / WebSocket
┌─────────────────────▼───────────────────────────────────────────┐
│                    FASTAPI BACKEND (Railway)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth API │  │ Data API │  │  ML API  │  │   OCR Service  │  │
│  │  /auth/* │  │/sites/*  │  │/anomaly/*│  │  /ocr/upload   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
└───────────┬──────────────┬──────────────┬───────────────────────┘
            │              │              │
    ┌───────▼──────┐ ┌─────▼──────┐ ┌───▼────────────┐
    │  Supabase DB │ │ Supabase   │ │   Background   │
    │  PostgreSQL  │ │  Storage   │ │  Job Queue     │
    │  (Tables +   │ │ (PDF/CSV)  │ │  (Celery/RQ)  │
    │   RLS)       │ └────────────┘ └────────────────┘
    └──────────────┘
```

### 2.3 Environnements

| Env | URL | Usage |
|-----|-----|-------|
| Development | http://localhost:5173 | Dev local |
| Staging | https://staging.enersight-ci.com | Tests |
| Production | https://app.enersight-ci.com | Clients |

---

## 3. MODÈLE DE DONNÉES (Base de données)

### 3.1 Schema PostgreSQL complet

```sql
-- ══════════════════════════════════════════════════
-- ORGANISATIONS (tenants multi-entreprises)
-- ══════════════════════════════════════════════════
CREATE TABLE organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,                    -- "SODEMI Extraction SA"
  slug        TEXT UNIQUE NOT NULL,             -- "sodemi-extraction"
  sector      TEXT NOT NULL,                    -- 'mines' | 'petrole' | 'industrie' | 'tertiaire'
  country     TEXT DEFAULT 'CI',
  city        TEXT,                             -- "Abidjan", "Bondoukou"
  plan        TEXT DEFAULT 'starter',           -- 'starter' | 'pro' | 'enterprise'
  plan_price_fcfa INT,                          -- 150000 | 400000 | custom
  max_sites   INT DEFAULT 3,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- UTILISATEURS
-- ══════════════════════════════════════════════════
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id       UUID REFERENCES organizations(id),
  full_name    TEXT NOT NULL,
  email        TEXT UNIQUE NOT NULL,
  role         TEXT NOT NULL DEFAULT 'viewer',
  -- 'admin' | 'energy_manager' | 'operator' | 'viewer' | 'ministry_auditor'
  avatar_url   TEXT,
  language     TEXT DEFAULT 'fr',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- SITES / INSTALLATIONS
-- ══════════════════════════════════════════════════
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,               -- "Mine Tortiya"
  code            TEXT,                        -- "TOR-01"
  type            TEXT NOT NULL,               -- 'mine_or' | 'mine_diamant' | 'petrole' | 'industrie'
  region          TEXT,                        -- "Hambol", "Haut-Sassandra"
  coordinates     JSONB,                       -- {lat: 8.16, lng: -5.47}
  cie_account_num TEXT,                        -- N° contrat CIE
  subscribed_power_kva NUMERIC(10,2),          -- Puissance souscrite actuelle (kVA)
  tariff_category TEXT DEFAULT 'BT',          -- 'BT' | 'MT' | 'HT' (basse/moyenne/haute tension)
  has_diesel      BOOLEAN DEFAULT false,
  num_generators  INT DEFAULT 0,
  generator_capacity_kva NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT now(),
  is_active       BOOLEAN DEFAULT true
);

-- ══════════════════════════════════════════════════
-- RELEVÉS DE CONSOMMATION MENSUELS
-- ══════════════════════════════════════════════════
CREATE TABLE consumption_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  -- Période
  period_year     INT NOT NULL,
  period_month    INT NOT NULL,                -- 1-12
  -- Consommation électrique CIE
  kwh_hpe         NUMERIC(12,2),              -- kWh Heures Pleines Eté
  kwh_hce         NUMERIC(12,2),              -- kWh Heures Creuses Eté
  kwh_hpp         NUMERIC(12,2),              -- kWh Heures Pleines Pointe (si MT/HT)
  kwh_total       NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(kwh_hpe,0) + COALESCE(kwh_hce,0) + COALESCE(kwh_hpp,0)) STORED,
  -- Puissance
  peak_power_kw   NUMERIC(10,2),              -- Puissance max atteinte
  power_factor    NUMERIC(4,3),               -- Cos φ (0.75 - 1.0)
  -- Facturation CIE
  cie_amount_fcfa INT,                        -- Montant total facture CIE
  cie_penalty_fcfa INT DEFAULT 0,             -- Pénalités cos φ ou dépassement
  cie_invoice_url TEXT,                       -- URL PDF stocké dans Supabase Storage
  -- Diesel
  diesel_liters   NUMERIC(10,2) DEFAULT 0,
  diesel_cost_fcfa INT DEFAULT 0,
  diesel_hours    NUMERIC(8,2) DEFAULT 0,     -- Heures de fonctionnement groupes
  -- Source des données
  data_source     TEXT DEFAULT 'manual',      -- 'manual' | 'ocr' | 'csv_import' | 'api'
  ocr_confidence  NUMERIC(5,2),               -- Score confiance OCR (0-100)
  -- Méta
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(site_id, period_year, period_month)
);

-- ══════════════════════════════════════════════════
-- FACTURES CIE (résultat OCR)
-- ══════════════════════════════════════════════════
CREATE TABLE cie_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  site_id         UUID REFERENCES sites(id),
  file_url        TEXT NOT NULL,               -- URL PDF dans Storage
  file_name       TEXT,
  -- Données extraites par OCR
  invoice_number  TEXT,
  invoice_date    DATE,
  period_start    DATE,
  period_end      DATE,
  kwh_hpe         NUMERIC(12,2),
  kwh_hce         NUMERIC(12,2),
  kwh_total       NUMERIC(12,2),
  peak_power_kw   NUMERIC(10,2),
  power_factor    NUMERIC(4,3),
  subscribed_kva  NUMERIC(10,2),
  amount_ht_fcfa  INT,
  tva_fcfa        INT,
  amount_ttc_fcfa INT,
  penalty_fcfa    INT DEFAULT 0,
  -- OCR metadata
  ocr_status      TEXT DEFAULT 'pending',     -- 'pending' | 'processing' | 'done' | 'error'
  ocr_confidence  NUMERIC(5,2),
  ocr_raw_text    TEXT,
  ocr_error       TEXT,
  -- Validation utilisateur
  is_validated    BOOLEAN DEFAULT false,
  validated_by    UUID REFERENCES users(id),
  validated_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- ANOMALIES DÉTECTÉES PAR IA
-- ══════════════════════════════════════════════════
CREATE TABLE anomalies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  site_id         UUID NOT NULL REFERENCES sites(id),
  consumption_id  UUID REFERENCES consumption_records(id),
  -- Classification
  type            TEXT NOT NULL,
  -- 'overconsumption' | 'power_factor_low' | 'peak_excess' | 'diesel_waste' | 'tariff_penalty'
  severity        TEXT NOT NULL DEFAULT 'medium',
  -- 'low' | 'medium' | 'high' | 'critical'
  -- Détails
  title           TEXT NOT NULL,
  description     TEXT,
  detected_value  NUMERIC,                    -- Valeur détectée
  expected_value  NUMERIC,                    -- Valeur normale (baseline)
  deviation_pct   NUMERIC(6,2),              -- % d'écart
  -- Impact financier estimé
  estimated_loss_fcfa INT,
  -- Modèle ML
  ml_algorithm    TEXT DEFAULT 'isolation_forest',
  ml_score        NUMERIC(6,4),              -- Score d'anomalie (-1 à 0.5)
  ml_threshold    NUMERIC(6,4),
  -- Statut
  status          TEXT DEFAULT 'open',       -- 'open' | 'acknowledged' | 'resolved' | 'false_positive'
  acknowledged_by UUID REFERENCES users(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- RECOMMANDATIONS IA
-- ══════════════════════════════════════════════════
CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  site_id         UUID REFERENCES sites(id),  -- NULL = multi-sites
  anomaly_id      UUID REFERENCES anomalies(id),
  -- Contenu
  category        TEXT NOT NULL,
  -- 'tariff_optimization' | 'power_factor' | 'diesel_reduction' | 
  -- 'peak_shifting' | 'subscribed_power' | 'behavior_change'
  priority        TEXT DEFAULT 'medium',      -- 'low' | 'medium' | 'high' | 'urgent'
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  action_steps    JSONB,                      -- [{step: 1, text: "...", effort: "easy"}]
  -- ROI estimé
  savings_fcfa_monthly  INT,
  savings_fcfa_annual   INT,
  implementation_cost_fcfa INT DEFAULT 0,
  payback_months  NUMERIC(4,1),
  -- Statut
  status          TEXT DEFAULT 'pending',     -- 'pending' | 'applied' | 'dismissed'
  applied_by      UUID REFERENCES users(id),
  applied_at      TIMESTAMPTZ,
  -- Validité
  valid_until     DATE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- OPTIMISATION PUISSANCE SOUSCRITE
-- ══════════════════════════════════════════════════
CREATE TABLE power_optimization_analyses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         UUID NOT NULL REFERENCES sites(id),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  -- Données actuelles
  current_subscribed_kva  NUMERIC(10,2),
  current_annual_cost_fcfa INT,
  -- Analyse sur 12 mois
  avg_peak_kw     NUMERIC(10,2),
  max_peak_kw     NUMERIC(10,2),
  p95_peak_kw     NUMERIC(10,2),             -- 95e percentile
  utilization_rate NUMERIC(5,2),             -- % utilisation puissance souscrite
  -- Recommandation
  recommended_kva NUMERIC(10,2),
  expected_savings_fcfa INT,
  avg_power_factor NUMERIC(4,3),
  cos_phi_penalty_annual INT,
  -- Résultat
  analysis_period_months INT DEFAULT 12,
  computed_at     TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- ALERTES TEMPS RÉEL
-- ══════════════════════════════════════════════════
CREATE TABLE alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  site_id         UUID REFERENCES sites(id),
  type            TEXT NOT NULL,
  -- 'anomaly_detected' | 'invoice_due' | 'report_ready' | 'budget_exceeded'
  title           TEXT NOT NULL,
  message         TEXT,
  severity        TEXT DEFAULT 'info',        -- 'info' | 'warning' | 'critical'
  is_read         BOOLEAN DEFAULT false,
  read_by         UUID REFERENCES users(id),
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════
-- RAPPORTS GÉNÉRÉS
-- ══════════════════════════════════════════════════
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id),
  type            TEXT NOT NULL,
  -- 'monthly_summary' | 'anomaly_report' | 'roi_report' | 'ministry_compliance' | 'custom'
  title           TEXT NOT NULL,
  period_start    DATE,
  period_end      DATE,
  sites_included  UUID[],                     -- Array de site IDs
  file_url        TEXT,                       -- PDF dans Storage
  generated_by    UUID REFERENCES users(id),
  generated_at    TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'generating'   -- 'generating' | 'ready' | 'error'
);

-- ══════════════════════════════════════════════════
-- TARIFS CIE (référentiel)
-- ══════════════════════════════════════════════════
CREATE TABLE cie_tariffs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category        TEXT NOT NULL,              -- 'BT' | 'MT' | 'HT'
  time_slot       TEXT NOT NULL,              -- 'HPE' | 'HCE' | 'HPP'
  price_fcfa_kwh  NUMERIC(8,4) NOT NULL,
  valid_from      DATE NOT NULL,
  valid_to        DATE,
  source          TEXT                        -- "Arrêté ministériel n°XXX/2025"
);

-- Tarifs de référence 2025-2026 (approximatifs, à mettre à jour)
INSERT INTO cie_tariffs (category, time_slot, price_fcfa_kwh, valid_from) VALUES
  ('BT', 'HPE', 105.20, '2025-01-01'),
  ('BT', 'HCE', 72.50,  '2025-01-01'),
  ('MT', 'HPE', 89.30,  '2025-01-01'),
  ('MT', 'HCE', 58.10,  '2025-01-01'),
  ('MT', 'HPP', 145.80, '2025-01-01'),
  ('HT', 'HPE', 74.20,  '2025-01-01'),
  ('HT', 'HCE', 48.60,  '2025-01-01'),
  ('HT', 'HPP', 128.40, '2025-01-01');
```

### 3.2 Row Level Security (RLS)

```sql
-- Chaque organisation ne voit que ses propres données
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON sites
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- Même politique pour consumption_records, anomalies, recommendations, etc.
-- Ministry auditors voient TOUTES les organisations (role = 'ministry_auditor')
CREATE POLICY "ministry_read_all" ON organizations
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'ministry_auditor'
  );
```

---

## 4. MODULES FONCTIONNELS

### MODULE 1 — Dashboard Principal

**Route** : `/dashboard`  
**Rôles** : Tous

#### Composants UI
```
DashboardPage
├── KPIRow
│   ├── KPICard (Consommation totale — MWh)
│   ├── KPICard (Coût total — FCFA)
│   ├── KPICard (Économies réalisées — FCFA)
│   ├── KPICard (Anomalies actives — count)
│   └── KPICard (Empreinte CO₂ — t CO₂)
├── SiteSelector (dropdown multi-sites)
├── PeriodSelector (mois courant / 3M / 6M / 12M)
├── ConsumptionTrendChart (area chart 12 mois)
├── SiteComparisonChart (bar chart par site)
├── AnomalyFeed (5 dernières anomalies)
└── QuickRecommendations (3 top priorités)
```

#### Données
```typescript
interface DashboardKPIs {
  totalConsumptionMwh: number;
  totalCostFcfa: number;
  savingsRealizedFcfa: number;
  activeAnomaliesCount: number;
  co2TonnesEquivalent: number;
  dieselLitersTotal: number;
  avgPowerFactor: number;
  // vs période précédente
  consumptionChangePct: number;
  costChangePct: number;
}
```

#### Calculs importants
- **CO₂** : `kwh_total × 0.6 kg CO₂/kWh` (facteur émission réseau CI)
- **Diesel CO₂** : `litres × 2.65 kg CO₂/litre`
- **Économies** : Somme `recommendations.savings_fcfa_monthly` où `status = 'applied'`

---

### MODULE 2 — Import & OCR Factures CIE

**Route** : `/import`  
**Rôles** : admin, energy_manager, operator

#### Flux OCR (Backend)
```python
# FastAPI endpoint
@router.post("/ocr/upload")
async def upload_invoice(
    file: UploadFile,
    site_id: str,
    background_tasks: BackgroundTasks
):
    # 1. Valider le fichier (PDF ou image)
    # 2. Stocker dans Supabase Storage → cie_invoices/
    # 3. Créer record dans cie_invoices avec status='pending'
    # 4. Lancer tâche OCR en arrière-plan
    background_tasks.add_task(process_ocr, invoice_id)
    return {"invoice_id": invoice_id, "status": "pending"}

async def process_ocr(invoice_id: str):
    # 1. Télécharger PDF depuis Storage
    # 2. Convertir PDF → images (pdf2image)
    # 3. Prétraitement OpenCV :
    #    - Correction de perspective (warpPerspective)
    #    - Débruitage (fastNlMeansDenoising)
    #    - Binarisation adaptative (adaptiveThreshold)
    # 4. Tesseract OCR (lang=fra) sur chaque page
    # 5. Extraction champs par regex :
    PATTERNS = {
        "invoice_number": r"N°\s*[Ff]acture\s*:?\s*(\w+)",
        "period": r"[Pp]ériode\s*:?\s*(\d{2}/\d{4})\s*[àa-]\s*(\d{2}/\d{4})",
        "kwh_hpe": r"HPE\s*[\|\:]?\s*([\d\s,\.]+)\s*kWh",
        "kwh_hce": r"HCE\s*[\|\:]?\s*([\d\s,\.]+)\s*kWh",
        "peak_power": r"[Pp]uissance\s*[Mm]ax(?:imale)?\s*:?\s*([\d,\.]+)\s*kW",
        "power_factor": r"[Cc]os\s*[φϕ]\s*:?\s*(0[\.,]\d+)",
        "subscribed_kva": r"[Pp]uissance\s*[Ss]ouscrite\s*:?\s*([\d,\.]+)\s*kVA",
        "amount_ttc": r"[Tt]otal\s+[Àà]\s+[Pp]ayer\s*:?\s*([\d\s,\.]+)\s*FCFA",
        "penalty": r"[Pp]énalit[ée]\s*:?\s*([\d\s,\.]+)\s*FCFA",
    }
    # 6. Calculer score confiance (% champs extraits avec succès)
    # 7. Mettre à jour cie_invoices avec données extraites
    # 8. Si confidence > 70%, auto-créer consumption_record
    # 9. Notifier via WebSocket
```

#### Interface utilisateur
```
ImportPage
├── UploadZone (drag & drop PDF/image)
├── SiteSelector (pour quel site?)
├── InvoicePreview (aperçu PDF)
├── OCRResultsForm (champs pré-remplis, éditables)
│   ├── InvoiceNumber, Period
│   ├── kWh HPE, kWh HCE, kWh Total
│   ├── Peak Power (kW), Power Factor (cos φ)
│   ├── Subscribed Power (kVA)
│   ├── Amount TTC (FCFA), Penalties (FCFA)
├── ConfidenceIndicator (% OCR)
├── ValidateButton → crée consumption_record
└── ManualEntryFallback (formulaire manuel si OCR < 70%)

CSVImportSection
├── TemplateDownload (modèle Excel/CSV)
├── CSVUploadZone
├── ColumnMappingUI (quelle colonne = quel champ?)
└── ImportPreviewTable
```

#### Format CSV import
```csv
annee,mois,site_code,kwh_hpe,kwh_hce,puissance_max_kw,cos_phi,diesel_litres,diesel_cout_fcfa
2026,01,TOR-01,45230,12840,320.5,0.87,12500,9750000
2026,01,ISS-01,32180,9420,241.0,0.82,8200,6396000
```

---

### MODULE 3 — Détection d'Anomalies IA

**Route** : `/analytics` (onglet Anomalies)  
**Rôles** : admin, energy_manager

#### Algorithme ML (Backend Python)

```python
# services/anomaly_detector.py
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class EnerSightAnomalyDetector:
    def __init__(self, contamination=0.1):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=contamination,  # 10% de données anormales attendues
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
    
    def prepare_features(self, df: pd.DataFrame) -> np.ndarray:
        """
        Features utilisées pour la détection :
        - kwh_total : consommation totale
        - kwh_ratio_hpe_hce : ratio HPE/HCE (détecte consommation hors heures creuses)
        - peak_power_kw : puissance de pointe
        - power_factor : cos φ
        - diesel_kwh_equivalent : consommation diesel convertie en kWh
        - cost_per_kwh : coût moyen par kWh (détecte anomalies tarifaires)
        - month_sin / month_cos : saisonnalité encodée cycliquement
        """
        features = pd.DataFrame()
        features['kwh_total'] = df['kwh_total']
        features['ratio_hpe_hce'] = df['kwh_hpe'] / (df['kwh_hce'] + 1)
        features['peak_kw'] = df['peak_power_kw']
        features['power_factor'] = df['power_factor'].fillna(0.9)
        features['diesel_eq_kwh'] = df['diesel_liters'] * 3.5  # 1L diesel ≈ 3.5 kWh
        features['cost_per_kwh'] = df['cie_amount_fcfa'] / (df['kwh_total'] + 1)
        
        # Encodage cyclique du mois (évite discontinuité déc→jan)
        features['month_sin'] = np.sin(2 * np.pi * df['period_month'] / 12)
        features['month_cos'] = np.cos(2 * np.pi * df['period_month'] / 12)
        
        return self.scaler.fit_transform(features.fillna(0))
    
    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """Retourne df avec colonnes anomaly_score et is_anomaly"""
        if len(df) < 3:
            return df.assign(is_anomaly=False, anomaly_score=0)
        
        X = self.prepare_features(df)
        df['anomaly_score'] = self.model.fit_predict(X)  # -1 = anomalie
        df['anomaly_score_raw'] = self.model.score_samples(X)
        df['is_anomaly'] = df['anomaly_score'] == -1
        return df
    
    def classify_anomaly(self, record: dict) -> dict:
        """Classifie le type et calcule l'impact financier"""
        anomalies = []
        
        # 1. Détection cos φ faible (pénalités CIE)
        if record.get('power_factor', 1.0) < 0.85:
            penalty_est = self._estimate_cosphi_penalty(record)
            anomalies.append({
                'type': 'power_factor_low',
                'severity': 'high' if record['power_factor'] < 0.80 else 'medium',
                'title': f"Cos φ insuffisant : {record['power_factor']:.2f} (seuil CIE : 0.85)",
                'estimated_loss_fcfa': penalty_est
            })
        
        # 2. Consommation anormalement haute
        if record.get('deviation_pct', 0) > 20:
            anomalies.append({
                'type': 'overconsumption',
                'severity': 'high' if record['deviation_pct'] > 40 else 'medium',
                'title': f"Surconsommation de {record['deviation_pct']:.0f}% vs moyenne",
                'estimated_loss_fcfa': int(record['kwh_total'] * 0.2 * 90)  # 90 FCFA/kWh moyen
            })
        
        # 3. Diesel excessif
        if record.get('diesel_liters', 0) > record.get('avg_diesel', 0) * 1.3:
            diesel_excess = record['diesel_liters'] - record['avg_diesel']
            anomalies.append({
                'type': 'diesel_waste',
                'severity': 'medium',
                'title': f"Surconsommation diesel : +{diesel_excess:.0f}L vs moyenne",
                'estimated_loss_fcfa': int(diesel_excess * 780)
            })
        
        return anomalies
    
    def _estimate_cosphi_penalty(self, record: dict) -> int:
        """
        Formule CIE : pénalité si cos φ < 0.85
        Pénalité = Montant_facture × (0.85/cos_phi - 1) × 0.5
        """
        if record['power_factor'] >= 0.85:
            return 0
        factor = (0.85 / record['power_factor'] - 1) * 0.5
        return int(record.get('cie_amount_fcfa', 0) * factor)
```

#### API ML endpoints

```python
# GET /api/anomalies?site_id=&period_start=&period_end=&severity=
# POST /api/anomalies/{id}/acknowledge
# POST /api/anomalies/{id}/resolve
# POST /api/ml/run-detection?site_id=&months=12
# GET  /api/ml/model-status
```

---

### MODULE 4 — Optimisation Tarifaire CIE

**Route** : `/analytics` (onglet Optimisation)  
**Rôles** : admin, energy_manager

#### Calculateur Puissance Souscrite

```python
# services/tariff_optimizer.py

class TariffOptimizer:
    
    def analyze_subscribed_power(self, site_id: str, months: int = 12) -> dict:
        """
        Analyse si la puissance souscrite est adaptée à l'usage réel
        
        Règle CIE :
        - Puissance souscrite = puissance facturée même si non utilisée
        - Si dépassement puissance souscrite : pénalité = 3× le prix de la puissance dépassée
        - Optimum : P_souscrite ≈ P_95ème_percentile × 1.1 (marge sécurité 10%)
        """
        records = self.fetch_records(site_id, months)
        
        p95 = np.percentile([r.peak_power_kw for r in records], 95)
        p_max = max(r.peak_power_kw for r in records)
        p_avg = np.mean([r.peak_power_kw for r in records])
        current_kva = records[0].site.subscribed_power_kva
        current_kw = current_kva * 0.85  # en supposant cos φ = 0.85
        
        # Puissance recommandée (arrondie au multiple de 5 kVA supérieur)
        recommended_kw = p95 * 1.10
        recommended_kva = math.ceil(recommended_kw / 0.85 / 5) * 5
        
        # Calcul économies
        price_per_kva_month = 3_500  # FCFA/kVA/mois (approx BT)
        current_monthly = current_kva * price_per_kva_month
        recommended_monthly = recommended_kva * price_per_kva_month
        monthly_savings = current_monthly - recommended_monthly
        
        # Risque de dépassement
        overshoot_risk = 'low' if recommended_kva > p_max / 0.85 else 'medium'
        
        return {
            'current_kva': current_kva,
            'recommended_kva': recommended_kva,
            'p95_peak_kw': round(p95, 1),
            'max_peak_kw': round(p_max, 1),
            'utilization_rate': round(p_avg / current_kw * 100, 1),
            'monthly_savings_fcfa': int(monthly_savings),
            'annual_savings_fcfa': int(monthly_savings * 12),
            'overshoot_risk': overshoot_risk,
            'recommendation': 'reduce' if monthly_savings > 0 else 'maintain'
        }
    
    def optimize_time_slots(self, site_id: str) -> dict:
        """
        Analyse si la consommation peut être déplacée en HC pour économiser
        HPE ≈ 105 FCFA/kWh vs HCE ≈ 72 FCFA/kWh (différentiel ~33 FCFA/kWh)
        """
        records = self.fetch_records(site_id, 6)
        
        avg_hpe_kwh = np.mean([r.kwh_hpe for r in records])
        avg_hce_kwh = np.mean([r.kwh_hce for r in records])
        total_kwh = avg_hpe_kwh + avg_hce_kwh
        
        # Si ratio HPE/Total > 65% : potentiel de déplacement
        hpe_ratio = avg_hpe_kwh / total_kwh if total_kwh > 0 else 0
        shiftable_kwh = max(0, avg_hpe_kwh - total_kwh * 0.5)
        savings_per_kwh = 105.20 - 72.50  # HPE - HCE
        
        return {
            'hpe_ratio': round(hpe_ratio * 100, 1),
            'shiftable_kwh_monthly': round(shiftable_kwh, 0),
            'potential_savings_fcfa_monthly': int(shiftable_kwh * savings_per_kwh),
            'recommendation': 'Décaler les opérations non-critiques entre 22h et 6h'
        }
```

#### Interface UI - Optimisation
```
OptimizationTab
├── SubscribedPowerCard
│   ├── CurrentVsRecommendedGauge
│   ├── PeakDistributionChart (box plot 12 mois)
│   ├── SavingsProjection (FCFA/mois)
│   └── RequestChangeButton (contact CIE)
├── TimeSlotAnalysisCard
│   ├── HPEvHCEPieChart
│   ├── ShiftableLoadEstimate
│   └── PotentialSavings
└── CosPhi Improvement Card
    ├── CoPhiTrendChart
    ├── PenaltiesHistory
    └── CapacitorBankROI
```

---

### MODULE 5 — Recommandations IA

**Route** : `/recommendations`  
**Rôles** : Tous (lecture) / admin, energy_manager (appliquer)

#### Génération des recommandations

```python
# services/recommendation_engine.py

RECOMMENDATION_TEMPLATES = [
    {
        'category': 'power_factor',
        'condition': lambda r: r.avg_power_factor < 0.85,
        'title': "Installer une batterie de condensateurs",
        'template': "Votre cos φ moyen est de {cos_phi:.2f}. CIE applique une pénalité dès que cos φ < 0.85. L'installation d'une batterie de condensateurs automatique permettrait d'économiser {savings:,} FCFA/an.",
        'savings_formula': lambda r: int(r.cos_phi_penalty_annual * 0.9),
        'steps': [
            "Demander un audit électrique sur site",
            "Dimensionner la batterie de condensateurs (≈ {kvar} kVAr)",
            "Installer et paramétrer le régulateur automatique",
            "Vérifier la correction sur 3 factures CIE consécutives"
        ]
    },
    {
        'category': 'subscribed_power',
        'condition': lambda r: r.utilization_rate < 60,
        'title': "Réduire la puissance souscrite CIE",
        'template': "Vous utilisez seulement {util_rate:.0f}% de votre puissance souscrite ({current_kva} kVA). En la réduisant à {recommended_kva} kVA, vous économiseriez {savings:,} FCFA/mois sans risque de dépassement.",
        'savings_formula': lambda r: int((r.current_kva - r.recommended_kva) * 3500),
    },
    {
        'category': 'peak_shifting',
        'condition': lambda r: r.hpe_ratio > 65,
        'title': "Décaler les opérations en heures creuses",
        'template': "{hpe_ratio:.0f}% de votre consommation est en Heures Pleines (105 FCFA/kWh). En décalant les opérations non-critiques en Heures Creuses (72 FCFA/kWh), vous économiseriez {savings:,} FCFA/mois.",
    },
    {
        'category': 'diesel_reduction',
        'condition': lambda r: r.avg_diesel_liters > 5000,
        'title': "Optimiser le planning des groupes électrogènes",
        'template': "Vos groupes électrogènes consomment en moyenne {diesel_liters:,}L/mois ({diesel_cost:,} FCFA). Une meilleure synchronisation avec les coupures CIE prévisibles réduirait cette consommation de 15-20%.",
    }
]
```

#### Interface UI
```
RecommendationsPage
├── PriorityFilter (Urgent / High / Medium / Low)
├── CategoryFilter (Tarifaire / Diesel / Comportement / ...)
├── SiteFilter
├── RecommendationsList
│   └── RecommendationCard (x N)
│       ├── PriorityBadge
│       ├── CategoryIcon
│       ├── Title + Description
│       ├── SavingsAmount (FCFA/mois)
│       ├── ROIBadge (mois de retour)
│       ├── ActionSteps (accordéon)
│       ├── ApplyButton → PUT /recommendations/{id}/apply
│       └── DismissButton
└── SavingsSummary (total économies si tout appliqué)
```

---

### MODULE 6 — Calculateur ROI

**Route** : `/roi-calculator`  
**Rôles** : Tous

#### Logique de calcul (Frontend)

```typescript
interface ROIInputs {
  monthlyBillFcfa: number;           // Facture mensuelle moyenne
  dieselLitersPerMonth: number;       // Consommation diesel
  numSites: number;                   // Nombre de sites
  currentSubscribedKva: number;       // Puissance souscrite actuelle
  avgPowerFactor: number;             // Cos φ moyen actuel
  planType: 'starter' | 'pro' | 'enterprise';
}

interface ROIResults {
  // Économies estimées
  tariffOptimizationSavings: number;    // Optimisation tarifaire
  dieselReductionSavings: number;       // Réduction diesel
  penaltyAvoidanceSavings: number;      // Pénalités évitées
  totalMonthlySavings: number;
  totalAnnualSavings: number;
  
  // Coût abonnement
  subscriptionMonthlyCost: number;      // 150k / 400k / custom
  subscriptionAnnualCost: number;
  
  // ROI
  netAnnualBenefit: number;
  roi_ratio: number;                    // ex: 4.2 (4.2× l'investissement)
  paybackMonths: number;
  
  // Impact environnemental
  co2AvoidedTonnesPerYear: number;
}

function calculateROI(inputs: ROIInputs): ROIResults {
  const DIESEL_PRICE = 780;           // FCFA/litre
  const DIESEL_CO2 = 2.65;           // kg CO₂/litre
  const GRID_CO2 = 0.0006;           // t CO₂/kWh
  
  const plans = { starter: 150_000, pro: 400_000, enterprise: 800_000 };
  const subscriptionMonthly = plans[inputs.planType];
  
  // Optimisation tarifaire : ~12% de la facture CIE
  const tariffSavings = inputs.monthlyBillFcfa * 0.12;
  
  // Réduction diesel : ~18% par meilleure planification
  const dieselSavings = inputs.dieselLitersPerMonth * DIESEL_PRICE * 0.18;
  
  // Pénalités cos φ évitées
  const penaltySavings = inputs.avgPowerFactor < 0.85
    ? inputs.monthlyBillFcfa * (0.85 / inputs.avgPowerFactor - 1) * 0.5
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
    roi_ratio: Math.round((totalAnnual / (subscriptionMonthly * 12)) * 10) / 10,
    paybackMonths: Math.round((subscriptionMonthly * 12) / totalMonthly),
    co2AvoidedTonnesPerYear: Math.round(
      (inputs.dieselLitersPerMonth * DIESEL_CO2 * 0.18 * 12) / 1000 +
      (inputs.monthlyBillFcfa / 90 * GRID_CO2 * 0.12 * 12)
    )
  };
}
```

---

### MODULE 7 — Rapports & Export

**Route** : `/reports`  
**Rôles** : Tous (lecture) / admin, energy_manager (génération)

#### Types de rapports

| Type | Contenu | Format |
|------|---------|--------|
| Rapport mensuel | KPIs + anomalies + recommandations | PDF + Excel |
| Rapport ROI | Économies réalisées vs abonnement | PDF |
| Rapport conformité | Pour soumission au Ministère | PDF signé |
| Données brutes | Export complet 12 mois | CSV / Excel |
| Rapport audit CIE | Analyse factures + optimisations | PDF |

#### Génération PDF (Backend)

```python
# services/report_generator.py
from weasyprint import HTML, CSS
import jinja2

class ReportGenerator:
    def generate_monthly_report(self, org_id: str, year: int, month: int) -> bytes:
        """Génère un PDF via template Jinja2 + WeasyPrint"""
        data = self.fetch_report_data(org_id, year, month)
        
        template = self.env.get_template('monthly_report.html')
        html_content = template.render(**data)
        
        pdf = HTML(string=html_content, base_url=BASE_URL).write_pdf(
            stylesheets=[CSS(string=self.report_css)]
        )
        return pdf
```

---

### MODULE 8 — Vue Ministère (Régulateur)

**Route** : `/ministry`  
**Rôles** : ministry_auditor UNIQUEMENT

#### Fonctionnalités spécifiques

```typescript
// Vue agrégée multi-entreprises pour le régulateur
interface MinistryDashboard {
  // Statistiques sectorielles
  totalOrganizations: number;
  totalSites: number;
  totalConsumptionMwhNational: number;
  totalCo2EmissionsT: number;
  avgPowerFactor: number;
  
  // Classements
  topConsumersRanking: OrgConsumptionRank[];
  worstPowerFactorRanking: SitePowerFactorRank[];
  highestDieselDependency: SiteDieselRank[];
  
  // Tendances nationales
  nationalConsumptionTrend: MonthlyTrend[];
  co2TrendByMonth: MonthlyTrend[];
  
  // Alertes réglementaires
  nonCompliantSites: Site[];   // cos φ < 0.75 persistant
  reportsDue: OrgReport[];    // Rapports pas encore soumis
}
```

#### Interface UI
```
MinistryPage
├── NationalOverviewCards (KPIs sectoriels)
├── SectorBreakdownChart (mines vs pétrole vs industrie)
├── Co2EmissionsMap (carte Côte d'Ivoire par région)
├── ComplianceStatusTable (organisations + statut)
├── ReportRequestButton (demander rapport à une org)
└── ExportNationalData (CSV agrégé anonymisé)
```

---

## 5. API REST COMPLÈTE (FastAPI)

### 5.1 Authentification

```
POST   /auth/register          → Inscription + création org
POST   /auth/login             → JWT token
POST   /auth/refresh           → Refresh token
POST   /auth/logout
GET    /auth/me                → Profil utilisateur courant
```

### 5.2 Organisations

```
GET    /api/organizations/me                 → Org courante
PATCH  /api/organizations/me                 → Modifier infos org
GET    /api/organizations/me/stats           → Statistiques globales
```

### 5.3 Sites

```
GET    /api/sites                            → Liste sites de l'org
POST   /api/sites                            → Créer un site
GET    /api/sites/{site_id}                  → Détail site
PATCH  /api/sites/{site_id}                  → Modifier site
DELETE /api/sites/{site_id}                  → Désactiver site
GET    /api/sites/{site_id}/stats            → KPIs du site
```

### 5.4 Consommation

```
GET    /api/consumption?site_id=&year=&month=  → Relevés
POST   /api/consumption                         → Entrée manuelle
PATCH  /api/consumption/{id}                    → Corriger entrée
DELETE /api/consumption/{id}
GET    /api/consumption/export?format=csv       → Export CSV
POST   /api/consumption/import/csv              → Import CSV
```

### 5.5 OCR / Factures

```
POST   /api/ocr/upload                       → Upload + lancer OCR
GET    /api/ocr/invoices                     → Liste factures
GET    /api/ocr/invoices/{id}               → Détail + résultat OCR
PATCH  /api/ocr/invoices/{id}               → Corriger données OCR
POST   /api/ocr/invoices/{id}/validate      → Valider → crée consumption_record
DELETE /api/ocr/invoices/{id}
```

### 5.6 Anomalies

```
GET    /api/anomalies?site_id=&severity=&status=  → Liste
GET    /api/anomalies/{id}
POST   /api/anomalies/{id}/acknowledge
POST   /api/anomalies/{id}/resolve
POST   /api/anomalies/{id}/false-positive
POST   /api/ml/detect?site_id=&months=          → Lancer détection
GET    /api/ml/status                            → Statut modèle
```

### 5.7 Recommandations

```
GET    /api/recommendations?site_id=&category=&status=  → Liste
GET    /api/recommendations/{id}
POST   /api/recommendations/{id}/apply
POST   /api/recommendations/{id}/dismiss
POST   /api/recommendations/generate?site_id=    → Régénérer
```

### 5.8 Optimisation tarifaire

```
GET    /api/optimization/subscribed-power/{site_id}   → Analyse puissance
GET    /api/optimization/time-slots/{site_id}         → Analyse créneaux
GET    /api/optimization/power-factor/{site_id}       → Analyse cos φ
GET    /api/tariffs                                    → Référentiel tarifs CIE
```

### 5.9 Rapports

```
GET    /api/reports                              → Liste rapports
POST   /api/reports/generate                    → Générer rapport
GET    /api/reports/{id}                        → Statut
GET    /api/reports/{id}/download               → Télécharger PDF
```

### 5.10 Ministry (rôle auditor)

```
GET    /api/ministry/overview                   → Stats nationales
GET    /api/ministry/organizations              → Toutes les orgs
GET    /api/ministry/compliance                 → Statut conformité
GET    /api/ministry/export                     → Export agrégé CSV
```

### 5.11 WebSocket (temps réel)

```
WS     /ws/{org_id}    → Notifications en temps réel
                        → Events: anomaly_detected | ocr_complete | report_ready
```

---

## 6. AUTHENTIFICATION & SÉCURITÉ

### 6.1 Système d'authentification
- **Provider** : Supabase Auth (JWT RS256)
- **OAuth** : Google OAuth 2.0 (optionnel)
- **Sessions** : Access token 1h, Refresh token 7 jours
- **MFA** : TOTP optionnel (recommandé pour ministry_auditor)

### 6.2 Rôles & permissions

| Rôle | Dashboard | Import | Anomalies | Recommandations | Rapports | Sites | Users | Ministry |
|------|-----------|--------|-----------|-----------------|---------|-------|-------|----------|
| `admin` | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ❌ |
| `energy_manager` | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ RW | ✅ R | ❌ | ❌ |
| `operator` | ✅ R | ✅ W | ✅ R | ✅ R | ✅ R | ✅ R | ❌ | ❌ |
| `viewer` | ✅ R | ❌ | ✅ R | ✅ R | ✅ R | ✅ R | ❌ | ❌ |
| `ministry_auditor` | ❌ | ❌ | ❌ | ❌ | ✅ R | ❌ | ❌ | ✅ R |

### 6.3 Multi-tenancy
- Isolation stricte par `org_id` (RLS PostgreSQL)
- Chaque `ministry_auditor` est un utilisateur système séparé
- Les admins d'une organisation ne voient jamais les données d'une autre

---

## 7. INTERFACE UTILISATEUR

### 7.1 Design Tokens

```css
/* Palette principale */
--navy:    #0B2E4E;   /* Primaire - headers, texte important */
--amber:   #F59E0B;   /* Accent - CTAs, highlights */
--emerald: #10B981;   /* Succès, économies, positif */
--rose:    #EF4444;   /* Erreur, anomalie critique */
--sky:     #3B82F6;   /* Info, liens */
--midgray: #475569;   /* Texte secondaire */
--lightbg: #F2F6FB;   /* Fond cards light mode */

/* Typographie */
--font-display: 'Plus Jakarta Sans', sans-serif;   /* Titres, KPIs */
--font-body:    'Inter', sans-serif;               /* Corps, labels */

/* Espacement (scale 4px) */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px;
--space-4: 16px; --space-6: 24px; --space-8: 32px;
--space-12: 48px; --space-16: 64px;

/* Rayons */
--radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px;
```

### 7.2 Structure des routes React

```
/                          → Redirect → /dashboard
/login                     → Page connexion
/register                  → Inscription (nom, email, org, secteur)

/dashboard                 → Dashboard principal
/analytics                 → Analytique avancée (onglets: Trend / Anomalies / Optimisation)
/import                    → Import factures (onglets: OCR / CSV / Manuel)
/sites                     → Gestion des sites
/recommendations           → Recommandations IA
/roi-calculator            → Calculateur ROI
/reports                   → Rapports
/settings                  → Paramètres (profil, org, team, intégrations)
/ministry                  → Vue Ministère (rôle auditor uniquement)

/onboarding                → Flow de setup initial (étape 1-4)
```

### 7.3 Layout principal

```
AppShell
├── Sidebar (220px, collapsed: 64px)
│   ├── Logo EnerSight CI
│   ├── OrgSelector (dropdown)
│   ├── NavItems (icône + label)
│   └── UserMenu (avatar + logout)
├── TopBar (height: 56px)
│   ├── PageTitle
│   ├── SiteSelector (dropdown multi-sites)
│   ├── PeriodSelector
│   ├── NotificationBell (badge count)
│   └── HelpButton
└── MainContent (scroll area)
```

### 7.4 Responsive
- Desktop first (> 1024px) : sidebar + content
- Tablet (768-1024px) : sidebar collapsée + content
- Mobile (< 768px) : bottom nav bar + contenu plein écran

---

## 8. DONNÉES DE DÉMONSTRATION

### 8.1 Organisation de démo

```python
DEMO_ORG = {
    "name": "SODEMI Extraction SA",
    "slug": "sodemi-extraction",
    "sector": "mines",
    "plan": "pro"
}

DEMO_SITES = [
    {
        "name": "Mine Tortiya (Diamants)",
        "code": "TOR-01",
        "type": "mine_diamant",
        "region": "Hambol",
        "subscribed_power_kva": 800,
        "tariff_category": "MT",
        "has_diesel": True,
        "num_generators": 3
    },
    {
        "name": "Mine Issia Gold",
        "code": "ISS-01", 
        "type": "mine_or",
        "region": "Haut-Sassandra",
        "subscribed_power_kva": 600,
        "tariff_category": "MT",
        "has_diesel": True,
        "num_generators": 2
    },
    {
        "name": "Divo Pétro",
        "code": "DIV-01",
        "type": "petrole",
        "region": "Lôh-Djiboua",
        "subscribed_power_kva": 400,
        "tariff_category": "BT",
        "has_diesel": True,
        "num_generators": 2
    }
]

# Données mensuelles 12 mois (Janv-Déc 2025)
DEMO_CONSUMPTION = {
    "TOR-01": {  # kWh totaux par mois
        "monthly_kwh": [1050,980,1120,1180,1240,1310,1250,1190,1214,1160,1090,1020],
        "avg_power_factor": 0.83,  # Sous le seuil → pénalités CIE
        "avg_diesel_liters": 18500,
        "avg_cie_bill_fcfa": 11_500_000
    },
    "ISS-01": {
        "monthly_kwh": [780,810,845,870,892,910,895,876,890,870,840,810],
        "avg_power_factor": 0.88,
        "avg_diesel_liters": 12200,
        "avg_cie_bill_fcfa": 8_200_000
    },
    "DIV-01": {
        "monthly_kwh": [680,720,745,757,775,790,770,757,760,745,720,690],
        "avg_power_factor": 0.91,
        "avg_diesel_liters": 8400,
        "avg_cie_bill_fcfa": 6_800_000
    }
}
```

---

## 9. MODÈLE ÉCONOMIQUE SaaS

### 9.1 Plans tarifaires

| Plan | Prix/mois (FCFA) | Sites | Users | Modules inclus |
|------|-----------------|-------|-------|----------------|
| **Starter** | 150 000 | 1-3 | 5 | Dashboard + Import + Recommandations |
| **Pro** | 400 000 | 4-10 | 20 | Tout Starter + IA Anomalies + Optimisation + Rapports |
| **Enterprise** | Sur devis | Illimité | Illimité | Tout Pro + Module Ministère + API + SSO + SLA |

### 9.2 Modèle de revenus
- Facturation mensuelle ou annuelle (-15% annuel)
- Essai gratuit 30 jours (sans CB)
- Onboarding payant pour Enterprise : 500 000 FCFA/site

---

## 10. DÉPLOIEMENT & INFRASTRUCTURE

### 10.1 Variables d'environnement

```bash
# .env.production

# Supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Backend uniquement

# API Backend
VITE_API_URL=https://api.enersight-ci.com
API_SECRET_KEY=your-secret-key-256bits

# OCR
TESSERACT_PATH=/usr/bin/tesseract
OCR_MAX_FILE_SIZE_MB=20

# ML
ML_MODEL_PATH=/app/models/isolation_forest.pkl
ML_RETRAIN_SCHEDULE=0 2 * * 0  # Dimanche 2h du matin

# Email (notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=notifications@enersight-ci.com
SMTP_PASSWORD=xxx

# Storage
SUPABASE_STORAGE_BUCKET=enersight-files
MAX_STORAGE_PER_ORG_GB=5
```

### 10.2 Déploiement step-by-step

```bash
# Frontend (Vercel)
npm run build
vercel --prod

# Backend (Railway)
railway up
# Dockerfile fourni dans /backend/Dockerfile

# Migrations DB (Supabase)
supabase db push
supabase db reset --linked  # Production
```

### 10.3 Variables Railway (Backend)
```
PORT=8000
WORKERS=2
DATABASE_URL=postgresql://...
REDIS_URL=redis://...  # Pour file de tâches OCR
```

---

## 11. STRUCTURE DES FICHIERS DU PROJET

```
enersight-ci/
├── frontend/                          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── charts/               # Recharts wrappers
│   │   │   ├── layout/               # AppShell, Sidebar, TopBar
│   │   │   └── features/
│   │   │       ├── dashboard/
│   │   │       ├── import/
│   │   │       ├── anomalies/
│   │   │       ├── recommendations/
│   │   │       ├── optimization/
│   │   │       ├── roi-calculator/
│   │   │       ├── reports/
│   │   │       └── ministry/
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useConsumption.ts
│   │   │   ├── useAnomalies.ts
│   │   │   └── useRecommendations.ts
│   │   ├── lib/
│   │   │   ├── supabase.ts           # Client Supabase
│   │   │   ├── api.ts                # Client FastAPI
│   │   │   ├── calculations.ts       # Calculs ROI, CO₂
│   │   │   └── constants.ts          # Tarifs CIE, constantes
│   │   ├── stores/                   # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   └── appStore.ts
│   │   ├── types/                    # TypeScript interfaces
│   │   ├── pages/                    # Route components
│   │   └── App.tsx
│   ├── public/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                           # FastAPI + Python
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── auth.py
│   │   │   │   ├── sites.py
│   │   │   │   ├── consumption.py
│   │   │   │   ├── ocr.py
│   │   │   │   ├── anomalies.py
│   │   │   │   ├── recommendations.py
│   │   │   │   ├── optimization.py
│   │   │   │   ├── reports.py
│   │   │   │   └── ministry.py
│   │   ├── services/
│   │   │   ├── anomaly_detector.py   # Isolation Forest
│   │   │   ├── ocr_service.py        # Tesseract + OpenCV
│   │   │   ├── tariff_optimizer.py   # Calculs CIE
│   │   │   ├── recommendation_engine.py
│   │   │   ├── report_generator.py   # WeasyPrint PDF
│   │   │   └── websocket_manager.py
│   │   ├── models/                   # Pydantic schemas
│   │   ├── db/
│   │   │   ├── database.py           # Supabase client
│   │   │   └── migrations/           # SQL migration files
│   │   ├── core/
│   │   │   ├── config.py             # Settings (pydantic)
│   │   │   ├── security.py           # JWT validation
│   │   │   └── dependencies.py       # FastAPI deps
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_tariffs.sql
│   └── config.toml
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
│
└── README.md
```

---

## 12. TESTS

### 12.1 Backend (pytest)
```python
# tests/test_anomaly_detector.py
# tests/test_ocr_service.py
# tests/test_tariff_optimizer.py
# tests/test_api_consumption.py
# tests/test_api_auth.py
```

### 12.2 Frontend (Vitest + Testing Library)
```typescript
// src/__tests__/calculations.test.ts  → Calculs ROI/CO₂
// src/__tests__/Dashboard.test.tsx    → Rendu KPIs
// src/__tests__/ImportPage.test.tsx   → Upload + validation
```

### 12.3 E2E (Playwright)
```
tests/e2e/
├── auth.spec.ts         → Login / Register
├── import-csv.spec.ts   → Import + vérification données
├── anomaly.spec.ts      → Détection + acknowledge
└── roi-calc.spec.ts     → Calculateur ROI
```

---

## 13. CHECKLIST DE DÉVELOPPEMENT

### Phase 1 — Setup (Semaine 1)
- [ ] Initialiser monorepo (frontend + backend)
- [ ] Configurer Supabase (projet + schéma SQL + RLS)
- [ ] Configurer auth (Supabase Auth + middleware FastAPI)
- [ ] Déployer skeleton sur Vercel + Railway
- [ ] CI/CD GitHub Actions

### Phase 2 — Core (Semaine 2-3)
- [ ] Module Import (OCR + CSV + Manuel)
- [ ] Dashboard avec données réelles
- [ ] Module Sites CRUD
- [ ] Module Consommation CRUD

### Phase 3 — IA (Semaine 4)
- [ ] Service Isolation Forest
- [ ] Génération recommandations
- [ ] Module Optimisation tarifaire
- [ ] Calculateur ROI

### Phase 4 — Polish (Semaine 5-6)
- [ ] Module Rapports (PDF WeasyPrint)
- [ ] Module Ministère
- [ ] Notifications WebSocket
- [ ] Tests complets
- [ ] Données de démo SODEMI

---

## 14. GLOSSAIRE TECHNIQUE

| Terme | Définition |
|-------|-----------|
| **CIE** | Compagnie Ivoirienne d'Électricité — fournisseur réseau national |
| **HPE** | Heures Pleines Été — tarif élevé (8h-22h) : ~105 FCFA/kWh |
| **HCE** | Heures Creuses Été — tarif réduit (22h-8h) : ~72 FCFA/kWh |
| **HPP** | Heures de Pointe — tarif maximum (MT/HT seulement) |
| **BT / MT / HT** | Basse / Moyenne / Haute Tension — catégories abonnement CIE |
| **Cos φ** | Facteur de puissance — seuil CIE : 0.85 (pénalité si < 0.85) |
| **kVA** | Kilovolt-ampère — unité puissance souscrite |
| **SODEMI** | Société pour le Développement Minier — entreprise fictive de démo |
| **FCFA** | Franc CFA (Ouest-Africain) — monnaie locale |
| **Isolation Forest** | Algorithme ML non-supervisé de détection d'anomalies |
| **OCR** | Optical Character Recognition — lecture automatique de factures PDF |
| **RLS** | Row Level Security — isolation des données par organisation |

---

*Document généré le 31 Août 2026 — EnerSight CI v1.0 — SIREXE Hackathon 2026*

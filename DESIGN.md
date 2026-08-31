# EnerSight CI - Direction visuelle

Document dérivé de `SPEC.md` (source de vérité produit) et du skill `design-taste-frontend`.
Il gouverne le frontend `frontend/` (Vite 5 + React 18 + Tailwind 3.4 + shadcn/ui + Recharts).

---

## 1. Design Read

SaaS B2B d'intelligence energetique. Les utilisateurs sont des responsables energie, des
operateurs et des administrateurs de sites miniers, petroliers et industriels en Cote d'Ivoire,
plus un role auditeur pour le Ministere. Le produit transforme des factures CIE et des releves
en economies chiffrees en FCFA.

Ce que l'interface doit transmettre : rigueur, confiance, lisibilite immediate des montants.
Pas de fioriture, pas de wow marketing dans le produit. Chaque ecran repond a "combien je
consomme, combien ca coute, combien je peux economiser, ou est le probleme".

**Dials** (skill section 1) :

| Dial | Valeur | Raison |
|---|---|---|
| `DESIGN_VARIANCE` | 4 | App shell structure. Ruptures ponctuelles : KPI hero mis en avant, login en split. |
| `MOTION_INTENSITY` | 3 | `:hover` / `:active`, fade d'entree de page et de section. Aucune boucle infinie, aucun scroll hijack. |
| `VISUAL_DENSITY` | 5 | Daily app. Chiffres en `font-mono` tabulaire, tableaux compacts, cards a bordure fine plutot qu'ombres lourdes. |

---

## 2. Typographie

Stack impose Inter par la SPEC section 7.1 : **remplace** (consigne projet, skill section 4.1).

- **UI et titres** : `Geist Variable` (`@fontsource-variable/geist`). Hierarchie par le poids
  et la couleur, pas par une echelle geante. Titres de page en `text-xl font-semibold`,
  section en `text-sm font-medium uppercase tracking-wide text-muted-foreground` (avec parcimonie).
- **Chiffres, montants FCFA, kWh, kVA, codes site** : `Geist Mono Variable`
  (`@fontsource-variable/geist-mono`), toujours avec `tabular-nums`. Classe utilitaire `.num`.
- **Corps de texte long** (descriptions de recommandations, aide) : Geist, `leading-relaxed`,
  `max-w-[65ch]`.

Echelle : `text-xs` 12 / `text-sm` 14 (corps par defaut de l'app) / `text-base` 16 /
`text-lg` 18 / `text-xl` 20 / `text-2xl` 24 (KPI hero) / `text-3xl` 30 (montant unique fort).

Pas de serif. Pas de `<link>` Google Fonts : polices auto-hebergees via `@fontsource-variable`.

---

## 3. Couleur

Une seule couleur d'accent de marque (ocre), saturation 70 %. Bases neutres **Slate** (gris
froids, coherents avec le navy). Jamais de noir pur `#000000`, jamais de degrade violet "IA",
jamais de glow.

### 3.1 Tokens semantiques (CSS variables, format HSL shadcn) - mode clair verrouille en v1

```
--background            210 40% 98%     fond app (slate-50)
--foreground            222 47% 11%     texte principal (slate-900, pas de noir pur)
--card                  0 0% 100%       surface card
--card-foreground       222 47% 11%
--popover               0 0% 100%
--popover-foreground    222 47% 11%
--primary               209 75% 17%     navy #0B2E4E : boutons primaires, nav active, entete
--primary-foreground    210 40% 98%
--secondary             210 40% 94%     boutons secondaires, puces
--secondary-foreground  209 75% 17%
--muted                 210 40% 96%     fond zones calmes
--muted-foreground      215 19% 38%     texte secondaire (contraste AA sur blanc)
--accent                210 40% 94%     fond de hover discret (slate), PAS la couleur d'accent de marque
--accent-foreground     209 75% 17%
--destructive           0 72% 42%       rose-700 : erreurs, anomalie critique
--destructive-foreground 210 40% 98%
--border                214 32% 88%
--input                 214 32% 86%
--ring                  37 70% 42%      ocre : focus ring unique sur toute l'app
--radius                0.625rem        10px (SPEC --radius-md)
```

### 3.2 Tokens de marque et de donnee (hors shadcn)

```
--brand        209 75% 17%   navy, identique a --primary
--gold         37 70% 42%    ocre #C38822 : mark logo, indicateur nav active, highlight chiffre cle, focus
--gold-strong  37 72% 34%    ocre fonce pour texte sur fond clair (contraste AA)

Statut donnee (usage strictement fonctionnel, jamais decoratif) :
--pos          160 84% 24%   emerald-700  : economies, variation favorable, cos phi OK
--neg          0 72% 42%     rose-700     : surcout, anomalie critique, depassement
--warn         28 80% 34%    amber-700    : severite moyenne, seuil approche
--sev-high     19 88% 42%    orange-600   : severite haute
--info         200 96% 30%   sky-700      : information neutre, liens
```

Severite anomalie : `low` = slate-500 / `medium` = `--warn` / `high` = `--sev-high` /
`critical` = `--neg`. Le badge porte la couleur en fond a 12 % d'opacite + texte pleine couleur.

### 3.3 Palette graphiques Recharts (categorielle, 5 max, sat <= 75 %)

```
--chart-1  209 75% 30%   navy clair
--chart-2  37 70% 45%    ocre
--chart-3  190 55% 34%   teal
--chart-4  215 16% 55%   slate
--chart-5  258 28% 46%   indigo mat (PAS un violet sature)
```

Series temporelles : aire navy avec remplissage a 10 %. Comparaison de sites : barres, une
couleur par site depuis la palette ci-dessus. Coup de projecteur (site ou mois en anomalie) :
barre en `--gold`. Grille `--border` a 60 %, axes `--muted-foreground`, pas de legende quand
un seul serie, tooltip = card shadcn.

---

## 4. Layout et espacement

- Echelle 4px (SPEC 7.1). Gouttieres `gap-4` / `gap-6`. Padding de page `p-6 lg:p-8`.
- App shell (SPEC 7.3) : `Sidebar` 220px (repliee 64px) + `TopBar` 56px + zone de contenu
  scrollable, `max-w-[1400px] mx-auto`.
- Grilles en CSS Grid, jamais de math flex en pourcentage. Pas de grille 3 colonnes egales
  decorative (skill section 9.C). La rangee KPI a 5 cellules (SPEC), pas 3 : strip responsive
  `grid-cols-2 md:grid-cols-3 xl:grid-cols-5`, la cellule "Economies realisees" est mise en
  avant (fond `--muted`, montant `text-2xl`, filet `--gold` a gauche).
- Cards : `rounded-[--radius]`, `border`, `bg-card`, ombre uniquement `shadow-sm` teintee slate.
  Rayon unique sur toute l'app (skill section 4.4 Shape Lock) : 10px pour cards et inputs,
  `rounded-full` pour les seuls elements interactifs de type pill (badges de statut, avatar).
- Listes longues (> 5 lignes) : `divide-y` fin OU passage en table shadcn, jamais
  `border-t` + `border-b` sur chaque ligne (skill section 9.F).

---

## 5. Composants (conventions shadcn/ui)

- shadcn/ui personnalise, jamais l'etat par defaut (skill section 9.E) : rayon 10px, focus
  ring ocre 2px, ombres teintees, typo Geist.
- Icones : `@phosphor-icons/react` uniquement, `weight="regular"` par defaut, `weight="fill"`
  pour l'etat actif. Jamais de SVG d'icone dessine a la main. Pas de `lucide-react` dans le
  code applicatif.
- Boutons : primaire = fond navy, texte blanc (contraste AA verifie). Secondaire = `secondary`.
  Ghost pour actions de ligne. Libelle sur une ligne, 3 mots max pour un CTA.
- Etats obligatoires par ecran (skill section 4.5) : `loading` = skeleton a la forme du contenu
  final (pas de spinner circulaire generique), `empty` = message + action pour peupler,
  `error` = inline (formulaires) ou toast (transitoire, via `sonner`).
- Formulaires : label AU-DESSUS du champ, aide optionnelle presente dans le markup, erreur
  SOUS le champ. Jamais de placeholder en guise de label.
- Feedback tactile : `:active` applique `translate-y-[1px]` ou `scale-[0.99]`.

---

## 6. Motion (`MOTION_INTENSITY 3`)

- Autorise : transitions `:hover` / `:active` sur `transform` et `opacity` uniquement,
  `transition-colors` sur les liens et lignes, fade + `translate-y-1` a l'entree de page
  (150 a 200ms, `ease-out`), stagger leger (40ms) sur l'apparition des cards KPI.
- Interdit : boucles infinies (pulse, shimmer permanent, marquee), parallax, scroll hijack,
  `window.addEventListener('scroll')`, animation de `width` / `height` / `top` / `left`.
- `prefers-reduced-motion: reduce` : toutes les transitions non essentielles tombent a 0.
  Bloc global dans `index.css`.
- Le skeleton de chargement peut avoir une pulsation `animate-pulse` de Tailwind : c'est un
  etat transitoire de chargement, pas une decoration permanente.

---

## 7. Accessibilite

- Contraste : AA minimum pour le corps (4.5:1), verifie pour chaque bouton et chaque badge.
  `--muted-foreground` et `--gold-strong` sont calibres pour passer sur blanc.
- Focus visible partout : ring ocre 2px `--ring`, jamais `outline: none` sans remplacement.
- Cibles tactiles 44px minimum sur la bottom nav mobile.
- Tableaux : `<th scope>`, tri annonce, `caption` visuellement masquee.
- Graphiques : chaque graphique a un resume textuel ou une table de donnees accessible en
  parallele (au minimum `aria-label` decrivant la tendance).

---

## 8. Responsive (SPEC 7.4)

- Desktop first > 1024px : sidebar + contenu.
- Tablet 768 a 1024px : sidebar repliee (64px, icones seules) + contenu.
- Mobile < 768px : bottom nav bar (5 entrees max, la 6e dans un menu "Plus"), contenu plein
  ecran, `px-4 py-6`. Chaque grille multi-colonnes declare son repli mono-colonne dans le
  meme composant.

---

## 9. Anti-slop checklist appliquee (skill section 14, sous-ensemble pertinent produit)

- [x] Design Read declare, dials raisonnes depuis le brief.
- [x] Zero em-dash nulle part (code, commentaires, UI, ce document).
- [x] Un seul theme verrouille (clair en v1), tokens dark definis mais non actives.
- [x] Une seule couleur d'accent de marque (ocre), utilisee identiquement partout.
- [x] Un seul systeme de rayon (10px + pill pour interactifs).
- [x] Contraste boutons et badges verifie AA.
- [x] Pas d'Inter, pas de serif, pas de noir pur, pas de degrade violet, pas de glow.
- [x] Pas de grille 3 colonnes egales decorative.
- [x] Pas de boucle d'animation infinie.
- [x] Icones depuis une librairie autorisee (Phosphor), zero SVG d'icone a la main.
- [x] Pas de faux screenshot en `<div>`. Les apercus de facture utilisent un vrai
      `<embed>` / `<img>` du fichier uploade, sinon un slot placeholder etiquete.
- [x] Etats loading / empty / error prevus pour chaque ecran de donnees.
- [x] Nombres realistes issus de la SPEC section 8 (SODEMI), pas de `99.99%` invente.
- [x] Noms de personnes localises (Cote d'Ivoire), jamais "John Doe".

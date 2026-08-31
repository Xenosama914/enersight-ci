/** Formatage FR / Cote d'Ivoire. Montants en FCFA sans decimale. */

const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fcfa(value: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  if (opts.compact && Math.abs(value) >= 1_000_000) {
    return `${nf1.format(value / 1_000_000)} M FCFA`;
  }
  if (opts.compact && Math.abs(value) >= 1_000) {
    return `${nf0.format(value / 1_000)} k FCFA`;
  }
  return `${nf0.format(value)} FCFA`;
}

export function kwh(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf0.format(value)} kWh`;
}

export function mwh(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf1.format(value)} MWh`;
}

export function kva(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf0.format(value)} kVA`;
}

export function liters(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf0.format(value)} L`;
}

export function tonnes(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf1.format(value)} t`;
}

export function pct(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${digits === 0 ? nf0.format(value) : nf1.format(value)} %`;
}

export function signedPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  const sign = value > 0 ? "+" : "";
  return `${sign}${nf1.format(value)} %`;
}

export function cosPhi(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return nf2.format(value);
}

export function ratio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  return `${nf1.format(value)}:1`;
}

export function months(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "n/d";
  const rounded = Math.round(value * 10) / 10;
  return `${nf1.format(rounded)} mois`;
}

export function monthYear(year: number, month: number): string {
  const labels = [
    "janv.", "fevr.", "mars", "avr.", "mai", "juin",
    "juil.", "aout", "sept.", "oct.", "nov.", "dec.",
  ];
  return `${labels[month - 1]} ${year}`;
}

export function dateShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

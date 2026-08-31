import type { Icon } from "@phosphor-icons/react";
import {
  Bank,
  ChartLine,
  Calculator,
  FileText,
  Gauge,
  Lightbulb,
  MapPin,
  UploadSimple,
  WarningOctagon,
  Gear,
} from "@phosphor-icons/react";
import type { Role } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: Icon;
  roles: Role[] | "all";
  /** visible dans la bottom nav mobile (5 max) */
  mobile?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Tableau de bord", icon: Gauge, roles: "all", mobile: true },
  {
    to: "/analytics",
    label: "Analytique",
    icon: ChartLine,
    roles: ["admin", "energy_manager", "operator", "viewer"],
    mobile: true,
  },
  {
    to: "/import",
    label: "Import",
    icon: UploadSimple,
    roles: ["admin", "energy_manager", "operator"],
    mobile: true,
  },
  {
    to: "/recommendations",
    label: "Recommandations",
    icon: Lightbulb,
    roles: "all",
    mobile: true,
  },
  {
    to: "/anomalies",
    label: "Anomalies",
    icon: WarningOctagon,
    roles: ["admin", "energy_manager", "operator", "viewer"],
  },
  {
    to: "/sites",
    label: "Sites",
    icon: MapPin,
    roles: ["admin", "energy_manager", "operator", "viewer"],
  },
  { to: "/roi-calculator", label: "Calculateur ROI", icon: Calculator, roles: "all" },
  { to: "/reports", label: "Rapports", icon: FileText, roles: "all" },
  { to: "/ministry", label: "Vue Ministere", icon: Bank, roles: ["ministry_auditor"], mobile: true },
  {
    to: "/settings",
    label: "Parametres",
    icon: Gear,
    roles: ["admin", "energy_manager", "operator", "viewer"],
  },
];

export function canAccess(item: NavItem, role: Role): boolean {
  return item.roles === "all" || item.roles.includes(role);
}

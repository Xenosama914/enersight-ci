import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Period } from "@/types";

interface AppState {
  selectedSiteId: string | "all";
  period: Period;
  sidebarCollapsed: boolean;
  setSelectedSiteId: (id: string | "all") => void;
  setPeriod: (period: Period) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedSiteId: "all",
      period: "12m",
      sidebarCollapsed: false,
      setSelectedSiteId: (id) => set({ selectedSiteId: id }),
      setPeriod: (period) => set({ period }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: "enersight-app" },
  ),
);

export const PERIOD_LABELS: Record<Period, string> = {
  current: "Mois courant",
  "3m": "3 mois",
  "6m": "6 mois",
  "12m": "12 mois",
};

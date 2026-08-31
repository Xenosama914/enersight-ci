import { api } from "@/lib/api";
import { useAsync } from "@/hooks/useAsync";
import { useAppStore } from "@/stores/appStore";
import type { Period } from "@/types";

/** Hooks de donnees. Enveloppent `api` + `useAsync`. Voir SPEC.md section 11 (hooks/). */

export function useSites() {
  return useAsync(() => api.getSites(), []);
}

export function useOrganization() {
  return useAsync(() => api.getOrganization(), []);
}

export function useTeam() {
  return useAsync(() => api.getUsers(), []);
}

export function useKpis(siteId: string | "all", period: Period) {
  return useAsync(() => api.getKpis(siteId, period), [siteId, period]);
}

export function useConsumptionTrend(siteId: string | "all", period: Period) {
  return useAsync(() => api.getConsumptionTrend(siteId, period), [siteId, period]);
}

export function useSiteComparison(period: Period) {
  return useAsync(() => api.getSiteComparison(period), [period]);
}

export function useConsumptionRecords(siteId: string | "all", year?: number) {
  return useAsync(() => api.getConsumptionRecords(siteId, year), [siteId, year]);
}

export function useAnomalies(filters: { siteId?: string | "all"; severity?: string; status?: string }) {
  return useAsync(
    () => api.getAnomalies(filters),
    [filters.siteId, filters.severity, filters.status],
  );
}

export function useRecommendations(filters: {
  siteId?: string | "all";
  category?: string;
  status?: string;
}) {
  return useAsync(
    () => api.getRecommendations(filters),
    [filters.siteId, filters.category, filters.status],
  );
}

export function useSubscribedPowerAnalysis(siteId: string) {
  return useAsync(() => api.getSubscribedPowerAnalysis(siteId), [siteId]);
}

export function useTimeSlotAnalysis(siteId: string) {
  return useAsync(() => api.getTimeSlotAnalysis(siteId), [siteId]);
}

export function useReports() {
  return useAsync(() => api.getReports(), []);
}

/** Raccourci: contexte global site + periode depuis le store. */
export function useScope() {
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const period = useAppStore((s) => s.period);
  return { selectedSiteId, period };
}

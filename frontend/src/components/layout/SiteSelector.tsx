import { useAppStore } from "@/stores/appStore";
import { useSites } from "@/hooks/useEnerSight";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SiteSelector({ allowAll = true }: { allowAll?: boolean }) {
  const { data: sites } = useSites();
  const selectedSiteId = useAppStore((s) => s.selectedSiteId);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);

  return (
    <Select
      value={selectedSiteId}
      onValueChange={(v) => setSelectedSiteId(v as string | "all")}
    >
      <SelectTrigger className="h-8 w-[190px] text-xs">
        <SelectValue placeholder="Site" />
      </SelectTrigger>
      <SelectContent>
        {allowAll && <SelectItem value="all">Tous les sites</SelectItem>}
        {(sites ?? []).map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.code} - {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

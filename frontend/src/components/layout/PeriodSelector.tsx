import { PERIOD_LABELS, useAppStore } from "@/stores/appStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Period } from "@/types";

const ORDER: Period[] = ["current", "3m", "6m", "12m"];

export function PeriodSelector() {
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);

  return (
    <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
      <SelectTrigger className="h-8 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ORDER.map((p) => (
          <SelectItem key={p} value={p}>
            {PERIOD_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

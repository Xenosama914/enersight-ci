import { useState } from "react";
import { DownloadSimple, FileText, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReports } from "@/hooks/useEnerSight";
import { api } from "@/lib/api";
import { sites as seedSites } from "@/data/seed";
import { dateShort } from "@/lib/format";
import type { ReportStatus, ReportType } from "@/types";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  monthly_summary: "Synthese mensuelle",
  anomaly_report: "Rapport d'anomalies",
  roi_report: "Rapport ROI",
  ministry_compliance: "Rapport de conformite Ministere",
  custom: "Rapport personnalise",
};

const statusVariant: Record<ReportStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  generating: "warn",
  ready: "pos",
  error: "destructive",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  generating: "En generation",
  ready: "Pret",
  error: "Erreur",
};

export function ReportsPage() {
  const { data, loading, error, reload } = useReports();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ReportType>("monthly_summary");
  const [start, setStart] = useState("2025-06-01");
  const [end, setEnd] = useState("2025-06-30");

  async function generate() {
    await api.generateReport({
      type,
      title: `${REPORT_TYPE_LABELS[type]} - ${dateShort(start)}`,
      period_start: start,
      period_end: end,
      sites_included: seedSites.map((s) => s.id),
    });
    setOpen(false);
    toast.success("Generation lancee. Le rapport sera pret dans quelques instants.");
    reload();
    setTimeout(reload, 3000);
  }

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Rapports mensuels, ROI et conformite. Export PDF et Excel."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Generer un rapport
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun rapport"
          description="Generez votre premier rapport a partir des donnees importees."
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              Generer un rapport
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {(data ?? []).map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {REPORT_TYPE_LABELS[r.type]} - genere le {dateShort(r.generated_at)}
                    </p>
                  </div>
                  <Badge variant={statusVariant[r.status]}>{STATUS_LABELS[r.status]}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={r.status !== "ready"}
                    onClick={() => toast.info("Telechargement du PDF (demonstration).")}
                  >
                    <DownloadSimple className="h-4 w-4" />
                    PDF
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generer un rapport</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Type de rapport</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REPORT_TYPE_LABELS) as ReportType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {REPORT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="start">Debut de periode</Label>
                <Input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Fin de periode</Label>
                <Input
                  id="end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={generate}>Lancer la generation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

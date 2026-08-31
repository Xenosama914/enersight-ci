import { useMemo, useState } from "react";
import { CheckCircle, DownloadSimple, FileText } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { UploadZone } from "@/components/common/UploadZone";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSites } from "@/hooks/useEnerSight";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const CSV_TEMPLATE =
  "annee,mois,site_code,kwh_hpe,kwh_hce,puissance_max_kw,cos_phi,diesel_litres,diesel_cout_fcfa\n" +
  "2026,01,TOR-01,45230,12840,320.5,0.87,12500,9750000\n" +
  "2026,01,ISS-01,32180,9420,241.0,0.82,8200,6396000\n";

export function ImportPage() {
  return (
    <div className="space-y-6">
      <PageToolbar description="Alimentez la plateforme par lecture de facture CIE, import CSV ou saisie manuelle." />
      <Tabs defaultValue="ocr">
        <TabsList>
          <TabsTrigger value="ocr">Lecture facture</TabsTrigger>
          <TabsTrigger value="csv">Import CSV</TabsTrigger>
          <TabsTrigger value="manual">Saisie manuelle</TabsTrigger>
        </TabsList>
        <TabsContent value="ocr">
          <OcrTab />
        </TabsContent>
        <TabsContent value="csv">
          <CsvTab />
        </TabsContent>
        <TabsContent value="manual">
          <ManualTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type OcrFields = Record<string, string | number>;

function OcrTab() {
  const { data: sites } = useSites();
  const [siteId, setSiteId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [confidence, setConfidence] = useState(0);
  const [fields, setFields] = useState<OcrFields>({});

  async function handleFile(f: File) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus("processing");
    const res = await api.parseInvoiceOcr(f.name);
    setConfidence(res.confidence);
    setFields(res.fields);
    setStatus("done");
  }

  const lowConfidence = status === "done" && confidence < 70;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">1. Site concerne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un site" />
              </SelectTrigger>
              <SelectContent>
                {(sites ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">2. Facture CIE (PDF ou image)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!file ? (
              <UploadZone
                accept="application/pdf,image/*"
                hint="PDF ou photo de facture, 20 Mo maximum"
                onFile={handleFile}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setFile(null);
                      setPreviewUrl(null);
                      setStatus("idle");
                      setFields({});
                    }}
                  >
                    Remplacer
                  </Button>
                </div>
                {previewUrl && file.type.startsWith("image/") ? (
                  <img
                    src={previewUrl}
                    alt={`Apercu de ${file.name}`}
                    className="max-h-72 w-full rounded-md border object-contain"
                  />
                ) : previewUrl ? (
                  <embed
                    src={previewUrl}
                    type="application/pdf"
                    className="h-72 w-full rounded-md border"
                  />
                ) : null}
              </div>
            )}

            {status === "processing" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Lecture en cours...</p>
                <Progress value={60} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm">3. Donnees extraites</CardTitle>
          {status === "done" && (
            <span
              className={cn(
                "num text-xs font-medium",
                lowConfidence ? "text-warn" : "text-pos",
              )}
            >
              Confiance OCR {confidence} %
            </span>
          )}
        </CardHeader>
        <CardContent>
          {status !== "done" ? (
            <EmptyState
              title="En attente d'une facture"
              description="Les champs seront pre-remplis apres la lecture. Vous pourrez les corriger avant validation."
            />
          ) : (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!siteId) {
                  toast.error("Selectionnez d'abord un site.");
                  return;
                }
                toast.success("Releve cree a partir de la facture.");
                setFile(null);
                setPreviewUrl(null);
                setStatus("idle");
                setFields({});
              }}
            >
              {lowConfidence && (
                <p className="rounded-md bg-warn/10 px-3 py-2 text-xs text-warn">
                  Confiance faible. Verifiez chaque champ ou passez en saisie manuelle.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["invoice_number", "N. facture"],
                  ["period", "Periode"],
                  ["kwh_hpe", "kWh HPE"],
                  ["kwh_hce", "kWh HCE"],
                  ["kwh_total", "kWh total"],
                  ["peak_power_kw", "Pointe (kW)"],
                  ["power_factor", "Cos phi"],
                  ["subscribed_kva", "Souscrit (kVA)"],
                  ["amount_ttc_fcfa", "Montant TTC (FCFA)"],
                  ["penalty_fcfa", "Penalites (FCFA)"],
                ].map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key} className="text-xs">
                      {label}
                    </Label>
                    <Input
                      id={key}
                      className="num h-8"
                      value={String(fields[key] ?? "")}
                      onChange={(e) =>
                        setFields((f) => ({ ...f, [key]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button type="submit" className="w-full">
                <CheckCircle className="h-4 w-4" />
                Valider et creer le releve
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CsvTab() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-enersight.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function parseCsv(file: File) {
    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    const head = lines[0].split(",").map((h) => h.trim());
    const parsed = lines.slice(1).map((line) => {
      const cells = line.split(",");
      return Object.fromEntries(head.map((h, i) => [h, (cells[i] ?? "").trim()]));
    });
    setHeaders(head);
    setRows(parsed);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-sm">Modele CSV</CardTitle>
            <p className="text-xs text-muted-foreground">
              Une ligne par site et par mois. Colonnes attendues fixes.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <DownloadSimple className="h-4 w-4" />
            Telecharger le modele
          </Button>
        </CardHeader>
        <CardContent>
          <UploadZone
            accept=".csv,text/csv"
            hint="Fichier CSV encode en UTF-8"
            onFile={parseCsv}
          />
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm">
              Apercu ({rows.length} ligne{rows.length > 1 ? "s" : ""})
            </CardTitle>
            <Button
              size="sm"
              disabled={importing}
              onClick={async () => {
                setImporting(true);
                const res = await api.importCsv(rows);
                setImporting(false);
                toast.success(
                  `${res.imported} releve(s) importe(s)` +
                    (res.skipped ? `, ${res.skipped} ignore(s)` : ""),
                );
                setRows([]);
                setHeaders([]);
              }}
            >
              {importing ? "Import..." : "Importer"}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 8).map((r, i) => (
                  <TableRow key={i}>
                    {headers.map((h) => (
                      <TableCell key={h} className="num text-xs">
                        {r[h]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ManualTab() {
  const { data: sites } = useSites();
  const [siteId, setSiteId] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Saisie d'un releve mensuel</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!siteId) {
              toast.error("Selectionnez un site.");
              return;
            }
            toast.success("Releve enregistre.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <div className="space-y-1.5">
            <Label>Site</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {(sites ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {[
            ["Annee", "number", "2026"],
            ["Mois", "number", "1"],
            ["kWh HPE", "number", ""],
            ["kWh HCE", "number", ""],
            ["Pointe (kW)", "number", ""],
            ["Cos phi", "number", ""],
            ["Montant CIE (FCFA)", "number", ""],
            ["Diesel (litres)", "number", ""],
            ["Cout diesel (FCFA)", "number", ""],
          ].map(([label, type, ph]) => (
            <div key={label} className="space-y-1.5">
              <Label>{label}</Label>
              <Input type={type} placeholder={ph} className="num" />
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Enregistrer le releve</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

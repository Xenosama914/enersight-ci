import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useSites } from "@/hooks/useEnerSight";
import { SITE_TYPE_LABELS } from "@/lib/constants";
import { kva } from "@/lib/format";
import type { SiteType, TariffCategory } from "@/types";

export function SitesPage() {
  const { data, loading, error, reload } = useSites();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageToolbar
        description="Installations rattachees a l'organisation. Puissance souscrite, categorie tarifaire et groupes electrogenes."
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouveau site
          </Button>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="Aucun site" description="Ajoutez votre premiere installation." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead className="text-right">Souscrit</TableHead>
                  <TableHead className="text-right">Groupes</TableHead>
                  <TableHead>Etat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="num font-medium">{s.code}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {SITE_TYPE_LABELS[s.type]}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.region}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {s.tariff_category}
                      </Badge>
                    </TableCell>
                    <TableCell className="num text-right">
                      {kva(s.subscribed_power_kva)}
                    </TableCell>
                    <TableCell className="num text-right">
                      {s.has_diesel ? s.num_generators : "0"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "pos" : "muted"}>
                        {s.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau site</DialogTitle>
          </DialogHeader>
          <form
            id="site-form"
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Site cree.");
              setOpen(false);
            }}
          >
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-name">Nom du site</Label>
              <Input id="s-name" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-code">Code</Label>
              <Input id="s-code" placeholder="TOR-02" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-region">Region</Label>
              <Input id="s-region" required />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select defaultValue="mine_or">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SITE_TYPE_LABELS) as SiteType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {SITE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Categorie tarifaire</Label>
              <Select defaultValue="MT">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["BT", "MT", "HT"] as TariffCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="s-kva">Puissance souscrite (kVA)</Label>
              <Input id="s-kva" type="number" className="num" required />
            </div>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button type="submit" form="site-form">
              Creer le site
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

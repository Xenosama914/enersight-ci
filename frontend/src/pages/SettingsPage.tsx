import { toast } from "sonner";
import { PageToolbar } from "@/components/layout/PageToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";
import { useTeam } from "@/hooks/useEnerSight";
import { PLANS, ROLE_LABELS, SECTOR_LABELS } from "@/lib/constants";
import { fcfa } from "@/lib/format";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const org = useAuthStore((s) => s.organization);
  const team = useTeam();

  return (
    <div className="space-y-6">
      <PageToolbar description="Profil, organisation et equipe." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="org">Organisation</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mes informations</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="max-w-md space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Profil mis a jour.");
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-sm">
                      {user?.full_name
                        .split(" ")
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {user && (
                    <Badge variant="secondary" className="font-normal">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Nom complet</Label>
                  <Input id="p-name" defaultValue={user?.full_name} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">Email</Label>
                  <Input id="p-email" type="email" defaultValue={user?.email} />
                </div>
                <Button type="submit">Enregistrer</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="org">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom" value={org?.name ?? ""} />
                <Field
                  label="Secteur"
                  value={org ? SECTOR_LABELS[org.sector] : ""}
                />
                <Field label="Ville" value={org?.city ?? ""} />
                <Field
                  label="Formule"
                  value={
                    org
                      ? `${PLANS[org.plan].label} - ${fcfa(PLANS[org.plan].priceFcfa, {
                          compact: true,
                        })}/mois`
                      : ""
                  }
                />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Membres de l'equipe</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(team.data ?? []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {ROLE_LABELS[m.role]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

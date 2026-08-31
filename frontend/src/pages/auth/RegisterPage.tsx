import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lightning } from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { SECTOR_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Sector } from "@/types";

export function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const register = useAuthStore((s) => s.register);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgName, setOrgName] = useState("");
  const [sector, setSector] = useState<Sector>("mines");

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    register({ fullName, email, orgName });
    navigate("/onboarding");
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Lightning className="h-4 w-4 text-primary-foreground" weight="fill" />
          </span>
          <span className="text-sm font-semibold">
            EnerSight <span className="text-gold-strong">CI</span>
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Creer une organisation</h1>
          <p className="text-sm text-muted-foreground">
            Essai gratuit 30 jours, sans carte bancaire.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adresse email professionnelle</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">Nom de l'organisation</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ex. Compagnie Miniere de l'Ouest"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Secteur</Label>
            <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
              <SelectTrigger id="sector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SECTOR_LABELS) as Sector[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SECTOR_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Commencer l'essai
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Deja un compte ?{" "}
          <Link to="/login" className="font-medium text-info hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Lightning } from "@phosphor-icons/react";
import { useAuthStore } from "@/stores/authStore";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/types";

const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: "admin", email: "koffi.aka@sodemi.ci" },
  { role: "energy_manager", email: "aminata.traore@sodemi.ci" },
  { role: "operator", email: "yao.nguessan@sodemi.ci" },
  { role: "viewer", email: "fatou.bamba@sodemi.ci" },
  { role: "ministry_auditor", email: "i.coulibaly@energie.gouv.ci" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const loginAs = useAuthStore((s) => s.loginAs);

  const [email, setEmail] = useState("koffi.aka@sodemi.ci");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = login(email);
    if (!res.ok) {
      setError(res.error ?? "Connexion impossible.");
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[1.1fr_1fr]">
      {/* Panneau marque */}
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-foreground/10">
            <Lightning className="h-5 w-5" weight="fill" />
          </span>
          <span className="text-base font-semibold">
            EnerSight <span className="text-gold">CI</span>
          </span>
        </div>

        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold leading-snug">
            Vos factures CIE et vos releves diesel, transformes en economies chiffrees en FCFA.
          </h1>
          <p className="text-sm text-primary-foreground/70">
            Intelligence energetique pour les industries extractives et industrielles de
            Cote d'Ivoire. Sans capteur, sans materiel IoT. Deployable en 48 heures.
          </p>
          <ul className="space-y-2 text-sm text-primary-foreground/80">
            <li>Reduction de 15 a 25 % des couts energetiques des le 1er mois</li>
            <li>Detection d'anomalies et recommandations chiffrees</li>
            <li>Vue multi-sites et rapports de conformite</li>
          </ul>
        </div>

        <p className="text-xs text-primary-foreground/50">
          SIREXE Hackathon 2026. Optimisation de la consommation energetique.
        </p>
      </div>

      {/* Formulaire */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Lightning className="h-4 w-4 text-primary-foreground" weight="fill" />
              </span>
              <span className="text-sm font-semibold">
                EnerSight <span className="text-gold-strong">CI</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Connexion</h2>
            <p className="text-sm text-muted-foreground">
              Acces a la plateforme SODEMI Extraction SA.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Environnement de demonstration: le mot de passe n'est pas verifie.
              </p>
            </div>

            {error ? (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Comptes de demonstration
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.role}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loginAs(acc.role);
                    navigate(acc.role === "ministry_auditor" ? "/ministry" : "/dashboard");
                  }}
                >
                  {ROLE_LABELS[acc.role]}
                </Button>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/register" className="font-medium text-info hover:underline">
              Creer une organisation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

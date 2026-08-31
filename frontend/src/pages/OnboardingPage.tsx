import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lightning } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";

const STEPS = [
  { title: "Bienvenue", body: "Configurons votre espace en quatre etapes rapides." },
  { title: "Premier site", body: "Ajoutez une installation avec sa puissance souscrite CIE." },
  { title: "Premiere facture", body: "Importez une facture CIE ou un export CSV de vos releves." },
  { title: "Objectifs", body: "Definissez une cible de reduction pour suivre vos economies." },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [step, setStep] = useState(0);

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Lightning className="h-4 w-4 text-primary-foreground" weight="fill" />
          </span>
          <span className="text-sm font-semibold">
            EnerSight <span className="text-gold-strong">CI</span>
          </span>
        </div>

        <ol className="flex gap-2">
          {STEPS.map((_, i) => (
            <li
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= step ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </ol>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Etape {step + 1} sur {STEPS.length}
          </p>
          <h1 className="text-xl font-semibold">{STEPS[step].title}</h1>
          <p className="text-sm text-muted-foreground">{STEPS[step].body}</p>
        </div>

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="o-name">Nom du site</Label>
              <Input id="o-name" placeholder="Mine principale" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="o-kva">Puissance souscrite (kVA)</Label>
              <Input id="o-kva" type="number" className="num" placeholder="600" />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-1.5">
            <Label htmlFor="o-target">Cible de reduction sur 12 mois</Label>
            <Input id="o-target" type="number" className="num" placeholder="15" />
            <p className="text-xs text-muted-foreground">En pourcentage du cout energetique actuel.</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? navigate("/dashboard") : setStep((s) => s - 1))}
          >
            {step === 0 ? "Passer" : "Retour"}
          </Button>
          <Button
            onClick={() => (isLast ? navigate("/dashboard") : setStep((s) => s + 1))}
          >
            {isLast ? (
              <>
                <Check className="h-4 w-4" />
                Terminer
              </>
            ) : (
              "Continuer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

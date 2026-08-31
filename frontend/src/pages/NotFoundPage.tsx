import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="num text-3xl font-semibold text-foreground">404</p>
      <p className="text-sm text-muted-foreground">
        Cette page n'existe pas ou a ete deplacee.
      </p>
      <Button asChild>
        <Link to="/dashboard">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}

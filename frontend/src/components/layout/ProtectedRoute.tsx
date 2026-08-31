import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { ROUTE_ROLES } from "@/lib/constants";
import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Lock } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export function ProtectedRoute({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const allowed = ROUTE_ROLES[location.pathname];
  const hasAccess = !allowed || allowed === "all" || allowed.includes(role);

  if (!hasAccess) {
    return (
      <AppShell title="Acces refuse">
        <EmptyState
          icon={Lock}
          title="Cette section n'est pas accessible avec votre role"
          description="Contactez un administrateur de votre organisation si vous pensez qu'il s'agit d'une erreur."
          action={
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              Retour au tableau de bord
            </Button>
          }
        />
      </AppShell>
    );
  }

  return <AppShell title={title}>{children}</AppShell>;
}

import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { AnomaliesPage } from "@/pages/AnomaliesPage";
import { ImportPage } from "@/pages/ImportPage";
import { RecommendationsPage } from "@/pages/RecommendationsPage";
import { RoiCalculatorPage } from "@/pages/RoiCalculatorPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SitesPage } from "@/pages/SitesPage";
import { MinistryPage } from "@/pages/MinistryPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function guard(title: string, element: React.ReactNode) {
  return <ProtectedRoute title={title}>{element}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },

  { path: "/dashboard", element: guard("Tableau de bord", <DashboardPage />) },
  { path: "/analytics", element: guard("Analytique", <AnalyticsPage />) },
  { path: "/anomalies", element: guard("Anomalies", <AnomaliesPage />) },
  { path: "/import", element: guard("Import des donnees", <ImportPage />) },
  { path: "/recommendations", element: guard("Recommandations", <RecommendationsPage />) },
  { path: "/roi-calculator", element: guard("Calculateur ROI", <RoiCalculatorPage />) },
  { path: "/reports", element: guard("Rapports", <ReportsPage />) },
  { path: "/sites", element: guard("Sites", <SitesPage />) },
  { path: "/ministry", element: guard("Vue Ministere", <MinistryPage />) },
  { path: "/settings", element: guard("Parametres", <SettingsPage />) },

  { path: "*", element: <NotFoundPage /> },
]);

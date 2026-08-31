import { RouterProvider } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { router } from "@/routes";

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  );
}

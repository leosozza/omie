import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import ConfigOmie from "@/pages/ConfigOmie";
import FieldMapping from "@/pages/FieldMapping";
import Logs from "@/pages/Logs";
import Robots from "@/pages/Robots";
import Simulator from "@/pages/Simulator";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            }
          />
          <Route
            path="/config"
            element={
              <DashboardLayout>
                <ConfigOmie />
              </DashboardLayout>
            }
          />
          <Route
            path="/mapping"
            element={
              <DashboardLayout>
                <FieldMapping />
              </DashboardLayout>
            }
          />
          <Route
            path="/logs"
            element={
              <DashboardLayout>
                <Logs />
              </DashboardLayout>
            }
          />
          <Route
            path="/robots"
            element={
              <DashboardLayout>
                <Robots />
              </DashboardLayout>
            }
          />
          <Route
            path="/simulator"
            element={
              <DashboardLayout>
                <Simulator />
              </DashboardLayout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

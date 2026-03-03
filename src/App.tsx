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
import Financas from "@/pages/Financas";
import Vendas from "@/pages/Vendas";
import Estoque from "@/pages/Estoque";
import CRM from "@/pages/CRM";
import Compras from "@/pages/Compras";
import Contratos from "@/pages/Contratos";
import Contador from "@/pages/Contador";
import Placements from "@/pages/Placements";
import Produtos from "@/pages/Produtos";
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
          <Route
            path="/financas"
            element={
              <DashboardLayout>
                <Financas />
              </DashboardLayout>
            }
          />
          <Route
            path="/vendas"
            element={
              <DashboardLayout>
                <Vendas />
              </DashboardLayout>
            }
          />
          <Route
            path="/estoque"
            element={
              <DashboardLayout>
                <Estoque />
              </DashboardLayout>
            }
          />
          <Route
            path="/crm"
            element={
              <DashboardLayout>
                <CRM />
              </DashboardLayout>
            }
          />
          <Route
            path="/compras"
            element={
              <DashboardLayout>
                <Compras />
              </DashboardLayout>
            }
          />
          <Route
            path="/contratos"
            element={
              <DashboardLayout>
                <Contratos />
              </DashboardLayout>
            }
          />
          <Route
            path="/contador"
            element={
              <DashboardLayout>
                <Contador />
              </DashboardLayout>
            }
          />
          <Route
            path="/placements"
            element={
              <DashboardLayout>
                <Placements />
              </DashboardLayout>
            }
          />
          <Route
            path="/produtos"
            element={
              <DashboardLayout>
                <Produtos />
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

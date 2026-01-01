import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { StatsCard } from "@/components/ui/stats-card";
import { ModuleCard } from "@/components/ui/module-card";
import { ConnectionStatus } from "@/components/dashboard/ConnectionStatus";
import { RecentLogs } from "@/components/dashboard/RecentLogs";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Wallet,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Truck,
  Calculator,
  Bot,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { memberId } = useTenant();

  // Fetch installation status
  const { data: installation } = useQuery({
    queryKey: ["installation", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase
        .from("bitrix_installations")
        .select("*")
        .eq("member_id", memberId)
        .single();
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch Omie config
  const { data: omieConfig } = useQuery({
    queryKey: ["omie-config", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase
        .from("omie_configurations")
        .select("*")
        .eq("tenant_id", memberId)
        .single();
      return data;
    },
    enabled: !!memberId,
  });

  // Fetch recent logs
  const { data: recentLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["recent-logs", memberId],
    queryFn: async () => {
      const query = supabase
        .from("integration_logs")
        .select("id, action, entity_type, status, created_at, error_message")
        .order("created_at", { ascending: false })
        .limit(10);

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data } = await query;
      return data || [];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", memberId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [successResult, errorResult, pendingResult] = await Promise.all([
        supabase
          .from("integration_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "success")
          .gte("created_at", today.toISOString()),
        supabase
          .from("integration_logs")
          .select("*", { count: "exact", head: true })
          .eq("status", "error")
          .gte("created_at", today.toISOString()),
        supabase
          .from("sync_queue")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      return {
        successToday: successResult.count || 0,
        errorsToday: errorResult.count || 0,
        pendingSync: pendingResult.count || 0,
      };
    },
  });

  const isBitrixConnected = installation?.status === "active";
  const isOmieConnected = omieConfig?.is_active === true;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient-omie">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground">
            Central de integração Bitrix24 ↔ Omie ERP
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/logs">Ver Logs</Link>
          </Button>
          <Button asChild className="gradient-primary shadow-glow hover:shadow-glow-accent transition-all">
            <Link to="/config">Configurar</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Sincronizações Hoje"
          value={stats?.successToday || 0}
          icon={CheckCircle2}
          variant="success"
          description="Operações concluídas"
        />
        <StatsCard
          title="Erros Hoje"
          value={stats?.errorsToday || 0}
          icon={AlertTriangle}
          variant={stats?.errorsToday && stats.errorsToday > 0 ? "error" : "default"}
          description="Precisam de atenção"
        />
        <StatsCard
          title="Fila Pendente"
          value={stats?.pendingSync || 0}
          icon={Clock}
          variant={stats?.pendingSync && stats.pendingSync > 5 ? "warning" : "default"}
          description="Aguardando processamento"
        />
        <StatsCard
          title="Taxa de Sucesso"
          value={
            stats?.successToday && (stats.successToday + (stats.errorsToday || 0)) > 0
              ? `${Math.round((stats.successToday / (stats.successToday + (stats.errorsToday || 0))) * 100)}%`
              : "N/A"
          }
          icon={TrendingUp}
          variant="info"
          description="Últimas 24 horas"
        />
      </div>

      {/* Module Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Módulos de Integração</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ModuleCard
            title="Finanças"
            description="Boletos, PIX, Contas a Pagar e Receber via Omie.Cash"
            icon={Wallet}
            href="/financas"
            color="financas"
            badge="Novo"
          />
          <ModuleCard
            title="Vendas"
            description="Pedidos de venda, orçamentos e faturamento"
            icon={ShoppingCart}
            href="/vendas"
            color="vendas"
          />
          <ModuleCard
            title="Estoque"
            description="Consulta, reservas e movimentações"
            icon={Package}
            href="/estoque"
            color="estoque"
          />
          <ModuleCard
            title="CRM"
            description="Sincronização bidirecional com Omie CRM"
            icon={Users}
            href="/crm"
            color="crm"
          />
          <ModuleCard
            title="Compras"
            description="Requisições, pedidos e notas de entrada"
            icon={Truck}
            href="/compras"
            color="compras"
          />
          <ModuleCard
            title="Contratos"
            description="Contratos de serviço e faturamento recorrente"
            icon={FileText}
            href="/contratos"
            color="servicos"
          />
          <ModuleCard
            title="Contador"
            description="XMLs fiscais e resumo contábil"
            icon={Calculator}
            href="/contador"
            color="contador"
          />
          <ModuleCard
            title="Robots"
            description="Automações para workflows do Bitrix24"
            icon={Bot}
            href="/robots"
            color="servicos"
            stats={{ label: "Ativos", value: "5" }}
          />
        </div>
      </div>

      {/* Connection Status & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connections */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Status das Conexões
            </CardTitle>
            <CardDescription>
              Estado atual das integrações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConnectionStatus
              name="Bitrix24"
              isConnected={isBitrixConnected}
              lastSync={installation?.updated_at}
            />
            <ConnectionStatus
              name="Omie ERP"
              isConnected={isOmieConnected}
              lastSync={omieConfig?.last_sync}
            />
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas sincronizações
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/logs">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentLogs logs={recentLogs} isLoading={logsLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

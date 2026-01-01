import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { ConnectionStatus } from "@/components/dashboard/ConnectionStatus";
import { RecentLogs } from "@/components/dashboard/RecentLogs";
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  ArrowUpRight,
  TrendingUp
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

      const query = supabase
        .from("integration_logs")
        .select("status", { count: "exact" });

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral do conector Bitrix24 ↔ Omie ERP
          </p>
        </div>
        <Button asChild className="gradient-primary shadow-glow">
          <Link to="/config">
            Configurar Omie
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatusCard
          title="Sincronizações Hoje"
          value={stats?.successToday || 0}
          icon={CheckCircle2}
          status="success"
          description="Operações concluídas com sucesso"
        />
        <StatusCard
          title="Erros Hoje"
          value={stats?.errorsToday || 0}
          icon={AlertTriangle}
          status={stats?.errorsToday && stats.errorsToday > 0 ? "error" : "default"}
          description="Falhas que precisam de atenção"
        />
        <StatusCard
          title="Fila Pendente"
          value={stats?.pendingSync || 0}
          icon={Clock}
          status={stats?.pendingSync && stats.pendingSync > 5 ? "warning" : "default"}
          description="Itens aguardando processamento"
        />
        <StatusCard
          title="Taxa de Sucesso"
          value={
            stats?.successToday && (stats.successToday + (stats.errorsToday || 0)) > 0
              ? `${Math.round((stats.successToday / (stats.successToday + (stats.errorsToday || 0))) * 100)}%`
              : "N/A"
          }
          icon={TrendingUp}
          status="info"
          description="Últimas 24 horas"
        />
      </div>

      {/* Connection Status & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connections */}
        <Card>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas sincronizações e eventos
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Configure e teste a integração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
              <Link to="/config">
                <span className="text-lg">⚙️</span>
                <span>Configurar Omie</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
              <Link to="/mapping">
                <span className="text-lg">🔗</span>
                <span>Mapear Campos</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
              <Link to="/robots">
                <span className="text-lg">🤖</span>
                <span>Ver Robots</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 p-4">
              <Link to="/simulator">
                <span className="text-lg">🧪</span>
                <span>Testar Integração</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

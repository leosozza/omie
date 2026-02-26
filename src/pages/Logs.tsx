import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ScrollText, 
  Search, 
  RefreshCw, 
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface LogEntry {
  id: string;
  tenant_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  request_payload: any;
  response_payload: any;
  error_message: string | null;
  execution_time_ms: number | null;
  created_at: string;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: "Sucesso" },
  error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Erro" },
  pending: { icon: Clock, color: "text-warning", bg: "bg-warning/10", label: "Pendente" },
  received: { icon: AlertTriangle, color: "text-info", bg: "bg-info/10", label: "Recebido" },
  skipped: { icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted", label: "Ignorado" },
};

export default function Logs() {
  const { memberId } = useTenant();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["integration-logs", memberId, statusFilter, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("integration_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (memberId) {
        query = query.eq("tenant_id", memberId);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      if (actionFilter) {
        query = query.ilike("action", `%${actionFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LogEntry[];
    },
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={`${config.bg} ${config.color} border-0`}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Logs de Integração
          </h1>
          <p className="text-muted-foreground">
            Histórico completo de sincronizações e eventos
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por ação..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-primary" />
            Registros
          </CardTitle>
          <CardDescription>
            {logs.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ScrollText className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold text-foreground">
                Nenhum log encontrado
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Os logs aparecerão aqui quando houver sincronizações
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tempo</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {log.action}
                      </code>
                    </TableCell>
                    <TableCell>
                      {log.entity_type ? (
                        <span className="text-sm">
                          {log.entity_type}
                          {log.entity_id && (
                            <span className="ml-1 text-muted-foreground">
                              #{log.entity_id.substring(0, 8)}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-right">
                      {log.execution_time_ms ? (
                        <span className="text-sm text-muted-foreground">
                          {log.execution_time_ms}ms
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ação</p>
                  <code className="text-sm">{selectedLog.action}</code>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedLog.status)}
                </div>
                {selectedLog.entity_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Entidade</p>
                    <p className="text-sm">{selectedLog.entity_type}</p>
                  </div>
                )}
                {selectedLog.execution_time_ms && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tempo de Execução</p>
                    <p className="text-sm">{selectedLog.execution_time_ms}ms</p>
                  </div>
                )}
              </div>

              {selectedLog.error_message && (
                <div>
                  <p className="text-sm font-medium text-destructive">Mensagem de Erro</p>
                  <p className="mt-1 text-sm text-destructive/80">{selectedLog.error_message}</p>
                </div>
              )}

              {selectedLog.request_payload && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Request Payload</p>
                  <ScrollArea className="mt-1 h-32 rounded border bg-muted/50 p-2">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.request_payload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.response_payload && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Response Payload</p>
                  <ScrollArea className="mt-1 h-32 rounded border bg-muted/50 p-2">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.response_payload, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

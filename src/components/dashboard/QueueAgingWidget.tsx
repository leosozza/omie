import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface QueueItem {
  id: string;
  action: string;
  entity_type: string;
  status: string;
  retry_count: number | null;
  max_retries: number | null;
  created_at: string;
  error_message: string | null;
  next_retry_at: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-0",
  processing: "bg-info/10 text-info border-0",
  retrying: "bg-warning/10 text-warning border-0",
  error: "bg-destructive/10 text-destructive border-0",
};

export function QueueAgingWidget() {
  const { memberId } = useTenant();

  const { data: queueItems = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["queue-aging", memberId],
    queryFn: async () => {
      const query = supabase
        .from("sync_queue")
        .select("id, action, entity_type, status, retry_count, max_retries, created_at, error_message, next_retry_at")
        .in("status", ["pending", "processing", "retrying", "error"])
        .order("created_at", { ascending: true })
        .limit(20);

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data } = await query;
      return (data || []) as QueueItem[];
    },
    refetchInterval: 30000,
  });

  const pendingCount = queueItems.filter(i => i.status === "pending").length;
  const retryingCount = queueItems.filter(i => i.status === "retrying").length;
  const errorCount = queueItems.filter(i => i.status === "error").length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Fila de Sincronização
          </CardTitle>
          <CardDescription>
            Itens aguardando processamento
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Summary badges */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <Badge variant="outline" className="bg-warning/10 text-warning border-0">
            {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="outline" className="bg-warning/10 text-warning border-0">
            {retryingCount} em retry
          </Badge>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-0">
            {errorCount} com erro
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : queueItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Fila vazia — tudo processado!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {queueItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusColors[item.status] || ""}>
                      {item.status}
                    </Badge>
                    <code className="truncate text-xs rounded bg-muted px-1 py-0.5">
                      {item.action}
                    </code>
                  </div>
                  {item.error_message && (
                    <p className="mt-1 truncate text-xs text-destructive">
                      <AlertTriangle className="mr-1 inline h-3 w-3" />
                      {item.error_message}
                    </p>
                  )}
                </div>
                <div className="ml-2 text-right text-xs text-muted-foreground whitespace-nowrap">
                  <div>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                  </div>
                  {item.retry_count ? (
                    <div className="text-warning">
                      Retry {item.retry_count}/{item.max_retries || 5}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogEntry {
  id: string;
  action: string;
  entity_type: string | null;
  status: string;
  created_at: string;
  error_message?: string | null;
}

interface RecentLogsProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

const statusIcons = {
  success: CheckCircle2,
  error: XCircle,
  pending: Clock,
  received: AlertTriangle,
  skipped: AlertTriangle,
};

const statusColors = {
  success: "text-green-500",
  error: "text-red-500",
  pending: "text-yellow-500",
  received: "text-blue-500",
  skipped: "text-muted-foreground",
};

export function RecentLogs({ logs, isLoading }: RecentLogsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        Nenhum log encontrado
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3 pr-4">
        {logs.map((log) => {
          const Icon = statusIcons[log.status as keyof typeof statusIcons] || Clock;
          const color = statusColors[log.status as keyof typeof statusColors] || "text-muted-foreground";

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
            >
              <div className={cn("mt-0.5", color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {log.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {log.entity_type && (
                  <p className="text-xs text-muted-foreground">
                    Entidade: {log.entity_type}
                  </p>
                )}
                {log.error_message && (
                  <p className="text-xs text-red-400">{log.error_message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

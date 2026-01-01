import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  name: string;
  logo?: string;
  isConnected: boolean;
  lastSync?: string | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function ConnectionStatus({
  name,
  logo,
  isConnected,
  lastSync,
  onRefresh,
  isRefreshing,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt={name} className="h-10 w-10 object-contain" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="text-lg font-bold text-primary">
              {name.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h3 className="font-semibold text-foreground">{name}</h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Conectado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Desconectado</span>
              </>
            )}
          </div>
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              Última sync: {new Date(lastSync).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      </div>
      {onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("h-4 w-4", isRefreshing && "animate-spin")}
          />
        </Button>
      )}
    </div>
  );
}

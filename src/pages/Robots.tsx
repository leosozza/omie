import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { MULTI_ROBOTS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Package,
  Users,
  Loader2,
  ChevronDown,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  CreditCard,
  FileText,
  Package,
  Users,
};

export default function Robots() {
  const { memberId } = useTenant();
  const [openRobots, setOpenRobots] = useState<string[]>([]);

  const { data: registeredRobots = [], isLoading } = useQuery({
    queryKey: ["robots-registry", memberId],
    queryFn: async () => {
      const query = supabase
        .from("robots_registry")
        .select("*");

      if (memberId) {
        query.eq("tenant_id", memberId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getRobotStatus = (code: string) => {
    const registered = registeredRobots.find((r) => r.robot_code === code);
    return registered;
  };

  const toggleRobot = (code: string) => {
    setOpenRobots((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Robots de Automação
        </h1>
        <p className="text-muted-foreground">
          5 robots multi-função disponíveis no editor de automação do Bitrix24
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-start gap-4 pt-6">
          <Bot className="h-10 w-10 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">Robots Multi-Função</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada robot oferece várias ações em um único componente. No editor de Workflows, 
              basta escolher a ação desejada no dropdown para executar diferentes operações 
              com o Omie ERP de forma organizada e eficiente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Warning */}
      {!memberId && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex items-center gap-4 pt-6">
            <Bot className="h-8 w-8 text-warning" />
            <div>
              <h3 className="font-semibold text-warning">Acesse pelo Bitrix24</h3>
              <p className="text-sm text-muted-foreground">
                Para ver o status dos robots do seu portal, abra este painel diretamente pelo Bitrix24.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Robots Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MULTI_ROBOTS.map((robot) => {
            const status = getRobotStatus(robot.code);
            const Icon = iconMap[robot.icon] || Bot;
            const isRegistered = status?.is_registered === true;
            const isOpen = openRobots.includes(robot.code);

            return (
              <Collapsible
                key={robot.code}
                open={isOpen}
                onOpenChange={() => toggleRobot(robot.code)}
              >
                <Card
                  className={cn(
                    "transition-all hover:shadow-lg",
                    isRegistered && "border-green-500/30"
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {robot.actions.length} ações
                        </Badge>
                        {isRegistered ? (
                          <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-500">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : status ? (
                          <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-500">
                            <XCircle className="mr-1 h-3 w-3" />
                            Erro
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-muted-foreground/50">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{robot.name}</CardTitle>
                    <CardDescription>{robot.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CollapsibleTrigger asChild>
                      <button className="flex w-full items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
                        <span>Ver ações disponíveis</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {robot.actions.map((action) => (
                        <div
                          key={action.value}
                          className="flex items-center gap-2 rounded-md bg-background/50 px-3 py-2 text-sm"
                        >
                          <Zap className="h-3.5 w-3.5 text-primary/70" />
                          <span>{action.label}</span>
                        </div>
                      ))}
                    </CollapsibleContent>
                    
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Código:</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {robot.code}
                        </code>
                      </div>
                      {status?.registered_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Registrado em:</span>
                          <span className="text-xs">
                            {new Date(status.registered_at).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      )}
                      {status?.last_error && (
                        <div className="mt-2 rounded bg-red-500/10 p-2 text-xs text-red-400">
                          {status.last_error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar os Robots Multi-Função?</CardTitle>
          <CardDescription>
            Siga os passos para configurar automações com os Robots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-3 pl-4 text-sm text-muted-foreground">
            <li>
              Acesse o <strong>CRM</strong> do Bitrix24 e selecione uma entidade (Negócios, Leads, etc.)
            </li>
            <li>
              Clique em <strong>"Regras e Gatilhos"</strong> ou <strong>"Workflows"</strong>
            </li>
            <li>
              Crie uma nova automação ou edite uma existente
            </li>
            <li>
              Na lista de ações, procure por <strong>"Omie: Vendas"</strong>, <strong>"Omie: Financeiro"</strong>, etc.
            </li>
            <li>
              Arraste o robot desejado e selecione a <strong>ação específica</strong> no dropdown
            </li>
            <li>
              Configure os parâmetros necessários e salve a automação
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

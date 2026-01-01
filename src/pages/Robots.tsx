import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { ROBOTS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart, 
  Wrench, 
  CreditCard, 
  FileText, 
  Package,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingCart,
  Wrench,
  CreditCard,
  FileText,
  Package,
};

export default function Robots() {
  const { memberId } = useTenant();

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Robots de Automação
        </h1>
        <p className="text-muted-foreground">
          Robots nativos disponíveis no editor de automação do Bitrix24
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="flex items-start gap-4 pt-6">
          <Bot className="h-10 w-10 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">O que são Robots?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Robots são ações automatizadas que aparecem no editor de Workflows do Bitrix24. 
              Quando configurados, eles permitem que suas automações interajam diretamente 
              com o Omie ERP sem precisar de ferramentas externas como Zapier ou Pluga.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Robots Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ROBOTS.map((robot) => {
            const status = getRobotStatus(robot.code);
            const Icon = iconMap[robot.icon] || Bot;
            const isRegistered = status?.is_registered === true;

            return (
              <Card
                key={robot.code}
                className={cn(
                  "transition-all hover:shadow-lg",
                  isRegistered && "border-green-500/30"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
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
                  <CardTitle className="text-lg">{robot.name}</CardTitle>
                  <CardDescription>{robot.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
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
            );
          })}
        </div>
      )}

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar os Robots?</CardTitle>
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
              Na lista de ações, procure por <strong>"Conector Omie"</strong>
            </li>
            <li>
              Arraste o robot desejado para o fluxo e configure os parâmetros
            </li>
            <li>
              Salve e ative a automação
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Layout, Loader2, Users, FileText, Building2, Briefcase } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PLACEMENTS = [
  {
    code: "CRM_DEAL_DETAIL_TAB",
    title: "Negócios (Deal)",
    description: "Aba 'Omie ERP' na ficha do negócio com resumo financeiro, pedidos e estoque",
    icon: Briefcase,
  },
  {
    code: "CRM_LEAD_DETAIL_TAB",
    title: "Leads",
    description: "Aba 'Omie ERP' na ficha do lead com dados do cliente e histórico",
    icon: Users,
  },
  {
    code: "CRM_CONTACT_DETAIL_TAB",
    title: "Contatos",
    description: "Aba 'Omie ERP' na ficha do contato com dados financeiros e pedidos",
    icon: FileText,
  },
  {
    code: "CRM_COMPANY_DETAIL_TAB",
    title: "Empresas",
    description: "Aba 'Omie ERP' na ficha da empresa com histórico completo",
    icon: Building2,
  },
];

export default function Placements() {
  const { memberId } = useTenant();

  const { data: installation, isLoading } = useQuery({
    queryKey: ["installation-placements", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data } = await supabase
        .from("bitrix_installations")
        .select("placements_registered, domain, status")
        .eq("member_id", memberId)
        .single();
      return data;
    },
    enabled: !!memberId,
  });

  const placementsRegistered = installation?.placements_registered ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Placements</h1>
        <p className="text-muted-foreground">
          Abas integradas do Omie ERP dentro das fichas do Bitrix24
        </p>
      </div>

      {!memberId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum tenant identificado. Instale o app pelo Marketplace do Bitrix24.
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Layout className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Status dos Placements</CardTitle>
                    <CardDescription>
                      Placements são abas personalizadas dentro das fichas do CRM
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={placementsRegistered ? "default" : "secondary"}>
                  {placementsRegistered ? "Registrados" : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {PLACEMENTS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.code} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{p.title}</CardTitle>
                          <code className="text-[10px] text-muted-foreground">{p.code}</code>
                        </div>
                      </div>
                      {placementsRegistered ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Como funciona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Os placements adicionam uma aba <strong>"Omie ERP"</strong> dentro das fichas de 
                Negócios, Leads, Contatos e Empresas no Bitrix24.
              </p>
              <p>
                Ao abrir a aba, o sistema busca automaticamente os dados do cliente no Omie e exibe:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>💰 Resumo financeiro (boletos, PIX, inadimplência)</li>
                <li>📦 Pedidos e notas fiscais vinculados</li>
                <li>👤 Histórico do cliente no Omie</li>
                <li>📊 Posição de estoque dos produtos</li>
              </ul>
              <p>
                Os placements são registrados automaticamente na primeira vez que o app é aberto 
                dentro do Bitrix24.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

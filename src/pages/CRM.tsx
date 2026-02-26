import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Users,
  Building2,
  Target,
  RefreshCw,
  Search,
  ArrowLeftRight,
  DollarSign,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { toast } from "sonner";

export default function CRM() {
  const { memberId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contas, isLoading: loadingContas, refetch: refetchContas, isFetching } = useQuery({
    queryKey: ["crm-contas", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-contratos-crm", {
        body: { tenant_id: memberId, action: "listar_contas_crm", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: oportunidades, isLoading: loadingOportunidades } = useQuery({
    queryKey: ["crm-oportunidades", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-contratos-crm", {
        body: { tenant_id: memberId, action: "listar_oportunidades", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const contasList = contas?.data?.clientes_cadastro || contas?.data?.contas || [];
  const oportunidadesList = oportunidades?.data?.oportunidades || oportunidades?.data?.oportunidade_cadastro || [];

  const filteredContas = contasList.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    return !term || String(c.razao_social || c.nome_fantasia || c.email || "").toLowerCase().includes(term);
  });

  const totalPipeline = oportunidadesList.reduce((acc: number, o: any) => acc + Number(o.nValor || o.valor || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Users className="h-8 w-8 text-primary" /></div>
            CRM
          </h1>
          <p className="mt-1 text-muted-foreground">Sincronização bidirecional entre Bitrix24 e Omie CRM</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { refetchContas(); toast.success("Sincronizando..."); }} disabled={isFetching}>
          <ArrowLeftRight className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Sincronizar Agora
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Contas/Contatos" value={String(contasList.length)} icon={Users} variant="info" description="No Omie CRM" />
        <StatsCard title="Empresas" value={String(contasList.filter((c: any) => c.cnpj_cpf?.length > 11).length)} icon={Building2} variant="default" description="CNPJ cadastrado" />
        <StatsCard title="Oportunidades" value={String(oportunidadesList.length)} icon={Target} variant="success" description="Em andamento" />
        <StatsCard title="Pipeline" value={`R$ ${totalPipeline.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="warning" description="Valor total" />
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20"><ArrowLeftRight className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="font-medium">Sincronização Bidirecional</p>
              <p className="text-sm text-muted-foreground">{memberId ? `${contasList.length} contas carregadas do Omie` : "Acesse pelo Bitrix24 para ativar"}</p>
            </div>
          </div>
          <Badge variant={memberId ? "default" : "secondary"}>{memberId ? "Conectado" : "Aguardando"}</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue="contatos" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="contatos" className="gap-2"><Users className="h-4 w-4" />Contatos</TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2"><Building2 className="h-4 w-4" />Empresas</TabsTrigger>
          <TabsTrigger value="oportunidades" className="gap-2"><Target className="h-4 w-4" />Oportunidades</TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Contatos / Contas</CardTitle><CardDescription>Contatos sincronizados do Omie CRM</CardDescription></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar contato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingContas ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={Users} title="Acesse pelo Bitrix24" />
              ) : filteredContas.length === 0 ? (
                <EmptyState icon={Users} title="Nenhum contato encontrado" description="Contas do Omie CRM aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>Nome Fantasia</TableHead>
                      <TableHead>CNPJ/CPF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContas.map((c: any, idx: number) => (
                      <TableRow key={c.codigo_cliente_omie || idx}>
                        <TableCell className="font-medium">{c.razao_social || "-"}</TableCell>
                        <TableCell>{c.nome_fantasia || "-"}</TableCell>
                        <TableCell>{c.cnpj_cpf || "-"}</TableCell>
                        <TableCell>{c.email || "-"}</TableCell>
                        <TableCell>{c.telefone1_numero || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Empresas</CardTitle><CardDescription>Contas com CNPJ cadastrado</CardDescription></CardHeader>
            <CardContent>
              {loadingContas ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (() => {
                const empresas = contasList.filter((c: any) => c.cnpj_cpf?.length > 11);
                return empresas.length === 0 ? (
                  <EmptyState icon={Building2} title="Nenhuma empresa encontrada" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Razão Social</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>Cidade/UF</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empresas.map((c: any, idx: number) => (
                        <TableRow key={c.codigo_cliente_omie || idx}>
                          <TableCell className="font-medium">{c.razao_social || "-"}</TableCell>
                          <TableCell>{c.cnpj_cpf || "-"}</TableCell>
                          <TableCell>{c.cidade || ""}{c.estado ? `/${c.estado}` : ""}</TableCell>
                          <TableCell>{c.email || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Oportunidades</CardTitle><CardDescription>Pipeline de vendas do Omie CRM</CardDescription></CardHeader>
            <CardContent>
              {loadingOportunidades ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : oportunidadesList.length === 0 ? (
                <EmptyState icon={Target} title="Nenhuma oportunidade encontrada" description="Oportunidades do Omie CRM aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Conta</TableHead>
                      <TableHead>Fase</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {oportunidadesList.map((o: any, idx: number) => (
                      <TableRow key={o.nCodOp || idx}>
                        <TableCell className="font-medium">{o.cDesOp || o.descricao || "-"}</TableCell>
                        <TableCell>{o.cNomeConta || o.conta || "-"}</TableCell>
                        <TableCell><Badge variant="outline">{o.cDesFase || o.fase || "-"}</Badge></TableCell>
                        <TableCell><Badge variant={o.cDesStatus === "Em andamento" ? "default" : "secondary"}>{o.cDesStatus || o.status || "-"}</Badge></TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(o.nValor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>}
    </div>
  );
}

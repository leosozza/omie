import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  FileText,
  Search,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Contratos() {
  const { memberId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: contratos, isLoading: loadingContratos, refetch, isFetching } = useQuery({
    queryKey: ["contratos", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-contratos-crm", {
        body: { tenant_id: memberId, action: "listar_contratos", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: renovacoes, isLoading: loadingRenovacoes } = useQuery({
    queryKey: ["contratos-renovacoes", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-contratos-crm", {
        body: { tenant_id: memberId, action: "listar_renovacoes_pendentes", data: {} },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const faturarMutation = useMutation({
    mutationFn: async (codigoContrato: number) => {
      const { data, error } = await supabase.functions.invoke("omie-contratos-crm", {
        body: { tenant_id: memberId, action: "faturar_contrato", data: { codigo_contrato: codigoContrato } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => { toast.success("Contrato faturado!"); refetch(); },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const contratosList = contratos?.data?.contratoCadastro || contratos?.data?.contratos || [];
  const renovacoesList = renovacoes?.data?.contratos || renovacoes?.data?.contratoCadastro || [];

  const ativos = contratosList.filter((c: any) => (c.cabecalho?.cEtapa || c.etapa) !== "99");
  const pendentes = contratosList.filter((c: any) => {
    const etapa = c.cabecalho?.cEtapa || c.etapa || "";
    return etapa === "10" || etapa === "20";
  });

  const mrr = ativos.reduce((acc: number, c: any) => {
    const valor = c.cabecalho?.nValorTotal || c.valor_total || c.valor_mensal || 0;
    return acc + Number(valor);
  }, 0);

  const filteredContratos = ativos.filter((c: any) => {
    const term = searchTerm.toLowerCase();
    const cab = c.cabecalho || c;
    return !term || String(cab.nCodCtr || cab.cDescricao || "").toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><FileText className="h-8 w-8 text-primary" /></div>
            Contratos
          </h1>
          <p className="mt-1 text-muted-foreground">Gestão de contratos de serviço e faturamento recorrente via Omie</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Sincronizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Contratos Ativos" value={String(ativos.length)} icon={FileText} variant="success" description="Em vigência" />
        <StatsCard title="MRR" value={`R$ ${mrr.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="info" description="Receita recorrente" />
        <StatsCard title="Renovações" value={String(renovacoesList.length)} icon={Calendar} variant={renovacoesList.length > 0 ? "warning" : "default"} description="Próximos 30 dias" />
        <StatsCard title="Pendentes Faturar" value={String(pendentes.length)} icon={Clock} variant="default" description="Este período" />
      </div>

      <Tabs defaultValue="ativos" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="ativos" className="gap-2"><CheckCircle2 className="h-4 w-4" />Ativos</TabsTrigger>
          <TabsTrigger value="renovar" className="gap-2"><AlertTriangle className="h-4 w-4" />Renovar</TabsTrigger>
          <TabsTrigger value="faturar" className="gap-2"><DollarSign className="h-4 w-4" />Faturar</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Contratos Ativos</CardTitle><CardDescription>Contratos de serviço em vigência</CardDescription></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar contrato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingContratos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={FileText} title="Acesse pelo Bitrix24" />
              ) : filteredContratos.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhum contrato ativo" description="Contratos do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContratos.map((c: any, idx: number) => {
                      const cab = c.cabecalho || c;
                      return (
                        <TableRow key={cab.nCodCtr || idx}>
                          <TableCell className="font-medium">{cab.nCodCtr || cab.codigo || "-"}</TableCell>
                          <TableCell>{cab.nCodCli || cab.codigo_cliente || "-"}</TableCell>
                          <TableCell>{cab.cDescricao || c.descricao || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{cab.cEtapa || "-"}</Badge></TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(cab.nValorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" title="Faturar" onClick={() => faturarMutation.mutate(cab.nCodCtr)} disabled={faturarMutation.isPending}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renovar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Contratos para Renovar</CardTitle>
              <CardDescription>Contratos com vencimento nos próximos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRenovacoes ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : renovacoesList.length === 0 ? (
                <EmptyState icon={Calendar} title="Nenhum contrato para renovar" description="✅ Todos os contratos estão em dia" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renovacoesList.map((c: any, idx: number) => {
                      const cab = c.cabecalho || c;
                      return (
                        <TableRow key={cab.nCodCtr || idx}>
                          <TableCell className="font-medium">{cab.nCodCtr || "-"}</TableCell>
                          <TableCell>{cab.nCodCli || "-"}</TableCell>
                          <TableCell>{cab.dDtFim || cab.data_fim || "-"}</TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(cab.nValorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Faturamento Pendente</CardTitle><CardDescription>Contratos prontos para faturar</CardDescription></div>
              </div>
            </CardHeader>
            <CardContent>
              {pendentes.length === 0 ? (
                <EmptyState icon={DollarSign} title="Nenhum contrato pendente" description="Contratos prontos para faturar aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendentes.map((c: any, idx: number) => {
                      const cab = c.cabecalho || c;
                      return (
                        <TableRow key={cab.nCodCtr || idx}>
                          <TableCell className="font-medium">{cab.nCodCtr || "-"}</TableCell>
                          <TableCell>{cab.nCodCli || "-"}</TableCell>
                          <TableCell><Badge variant="secondary">{cab.cEtapa || "-"}</Badge></TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(cab.nValorTotal || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" title="Faturar" onClick={() => faturarMutation.mutate(cab.nCodCtr)} disabled={faturarMutation.isPending}>
                              <Play className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

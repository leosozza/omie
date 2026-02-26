import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  ShoppingCart,
  FileText,
  Package,
  RefreshCw,
  Search,
  TrendingUp,
  Clock,
  Loader2,
  ExternalLink,
  Download,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

const ETAPA_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  "10": { label: "Orçamento", variant: "secondary" },
  "20": { label: "Pedido", variant: "outline" },
  "50": { label: "Faturado", variant: "default" },
  "60": { label: "Entregue", variant: "default" },
  "99": { label: "Cancelado", variant: "destructive" },
};

export default function Vendas() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: pedidos, isLoading: loadingPedidos, refetch: refetchPedidos, isFetching: fetchingPedidos } = useQuery({
    queryKey: ["pedidos-venda", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-create-order", {
        body: { tenant_id: memberId, action: "list", order_data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: nfes, isLoading: loadingNfes, refetch: refetchNfes } = useQuery({
    queryKey: ["nfes", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-invoice-handler", {
        body: { tenant_id: memberId, action: "list", invoice_type: "nfe", invoice_data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      await refetchPedidos();
      await refetchNfes();
    },
    onSuccess: () => toast.success("Dados sincronizados!"),
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });

  const pedidosList = pedidos?.data?.pedido_venda_produto || pedidos?.data?.pedidos || [];
  const nfeList = nfes?.data?.nfCadastro || nfes?.data?.nfe_cadastro || [];

  const filteredPedidos = pedidosList.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return !term || 
      String(p.cabecalho?.numero_pedido || p.numero_pedido || "").includes(term) ||
      String(p.cabecalho?.codigo_cliente || "").includes(term);
  });

  const totalVendas = pedidosList.reduce((acc: number, p: any) => {
    const valor = p.cabecalho?.valor_total || p.total_pedido || p.infoCadastro?.valor_total || 0;
    return acc + Number(valor);
  }, 0);

  const pedidosPendentes = pedidosList.filter((p: any) => {
    const etapa = p.cabecalho?.etapa || p.etapa || "";
    return etapa === "10" || etapa === "20";
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
            Vendas
          </h1>
          <p className="mt-1 text-muted-foreground">Pedidos de venda, orçamentos e faturamento integrados com Omie</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
            <RefreshCw className={`h-4 w-4 ${fetchingPedidos ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total em Pedidos" value={`R$ ${totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={TrendingUp} variant="success" description={`${pedidosList.length} pedidos`} />
        <StatsCard title="Pedidos Pendentes" value={String(pedidosPendentes)} icon={Clock} variant="warning" description="Aguardando faturamento" />
        <StatsCard title="NF-e Emitidas" value={String(nfeList.length)} icon={FileText} variant="info" description="Consultadas" />
        <StatsCard title="Ticket Médio" value={pedidosList.length > 0 ? `R$ ${(totalVendas / pedidosList.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "R$ 0"} icon={ShoppingCart} variant="default" description="Média por pedido" />
      </div>

      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pedidos" className="gap-2"><ShoppingCart className="h-4 w-4" />Pedidos</TabsTrigger>
          <TabsTrigger value="orcamentos" className="gap-2"><FileText className="h-4 w-4" />Orçamentos</TabsTrigger>
          <TabsTrigger value="nfe" className="gap-2"><Package className="h-4 w-4" />NF-e</TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pedidos de Venda</CardTitle>
                  <CardDescription>Pedidos sincronizados com Omie</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar pedido..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={ShoppingCart} title="Acesse pelo Bitrix24" description="Para visualizar pedidos, abra o painel pelo Bitrix24" />
              ) : filteredPedidos.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Nenhum pedido encontrado" description="Pedidos criados via robots ou diretamente na Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Pedido</TableHead>
                      <TableHead>Cód. Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPedidos.map((p: any, idx: number) => {
                      const cab = p.cabecalho || p;
                      const etapa = cab.etapa || "";
                      const etapaInfo = ETAPA_LABELS[etapa] || { label: etapa, variant: "outline" as const };
                      return (
                        <TableRow key={cab.codigo_pedido || idx}>
                          <TableCell className="font-medium">{cab.numero_pedido || cab.codigo_pedido || "-"}</TableCell>
                          <TableCell>{cab.codigo_cliente || cab.codigo_cliente_integracao || "-"}</TableCell>
                          <TableCell>{cab.data_previsao || cab.data_pedido || "-"}</TableCell>
                          <TableCell><Badge variant={etapaInfo.variant}>{etapaInfo.label}</Badge></TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(cab.valor_total || cab.total_pedido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Orçamentos</CardTitle><CardDescription>Pedidos na etapa de orçamento (etapa 10)</CardDescription></CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (() => {
                const orcamentos = pedidosList.filter((p: any) => (p.cabecalho?.etapa || p.etapa) === "10");
                return orcamentos.length === 0 ? (
                  <EmptyState icon={FileText} title="Nenhum orçamento pendente" description="Orçamentos aparecerão aqui quando criados" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Pedido</TableHead>
                        <TableHead>Cód. Cliente</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orcamentos.map((p: any, idx: number) => {
                        const cab = p.cabecalho || p;
                        return (
                          <TableRow key={cab.codigo_pedido || idx}>
                            <TableCell className="font-medium">{cab.numero_pedido || cab.codigo_pedido || "-"}</TableCell>
                            <TableCell>{cab.codigo_cliente || "-"}</TableCell>
                            <TableCell>{cab.data_previsao || "-"}</TableCell>
                            <TableCell className="text-right">R$ {Number(cab.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas Fiscais Eletrônicas</CardTitle>
              <CardDescription>NF-e emitidas via Omie</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingNfes ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={FileText} title="Acesse pelo Bitrix24" description="Para visualizar NF-e, abra o painel pelo Bitrix24" />
              ) : nfeList.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhuma NF-e encontrada" description="NF-e emitidas na Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº NF-e</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfeList.map((nf: any, idx: number) => (
                      <TableRow key={nf.nNF || idx}>
                        <TableCell className="font-medium">{nf.nNF || nf.numero_nf || "-"}</TableCell>
                        <TableCell>{nf.cSerie || nf.serie || "-"}</TableCell>
                        <TableCell>{nf.dDtEmissao || nf.data_emissao || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={nf.cStatus === "Autorizada" || nf.status === "autorizada" ? "default" : "secondary"}>
                            {nf.cStatus || nf.status || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">R$ {Number(nf.nValorNF || nf.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          {(nf.cLinkDanfe || nf.link_danfe) && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={nf.cLinkDanfe || nf.link_danfe} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
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

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
    </div>
  );
}

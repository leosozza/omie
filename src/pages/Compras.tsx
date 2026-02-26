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
  Truck,
  FileText,
  Package,
  RefreshCw,
  Search,
  Clock,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Compras() {
  const { memberId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: requisicoes, isLoading: loadingReq, refetch, isFetching } = useQuery({
    queryKey: ["compras-requisicoes", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_requisicoes", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: pedidosCompra, isLoading: loadingPedidos } = useQuery({
    queryKey: ["compras-pedidos", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_pedidos_compra", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: notasEntrada, isLoading: loadingNotas } = useQuery({
    queryKey: ["compras-notas", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_notas_entrada", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const reqList = requisicoes?.data?.requisicoes || requisicoes?.data?.requisicao_compra || [];
  const pedList = pedidosCompra?.data?.pedidos || pedidosCompra?.data?.pedido_compra || [];
  const notasList = notasEntrada?.data?.notas || notasEntrada?.data?.nfEntradaCadastro || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Truck className="h-8 w-8 text-primary" /></div>
            Compras
          </h1>
          <p className="mt-1 text-muted-foreground">Requisições, pedidos de compra e notas de entrada integrados com Omie</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Sincronizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Requisições" value={String(reqList.length)} icon={FileText} variant="warning" description="Cadastradas" />
        <StatsCard title="Pedidos de Compra" value={String(pedList.length)} icon={Truck} variant="info" description="Cadastrados" />
        <StatsCard title="Notas de Entrada" value={String(notasList.length)} icon={Package} variant="success" description="Registradas" />
        <StatsCard title="Prazo Médio" value="—" icon={Clock} variant="default" description="Lead time fornecedores" />
      </div>

      <Tabs defaultValue="requisicoes" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="requisicoes" className="gap-2"><FileText className="h-4 w-4" />Requisições</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2"><Truck className="h-4 w-4" />Pedidos</TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2"><Package className="h-4 w-4" />Entradas</TabsTrigger>
        </TabsList>

        <TabsContent value="requisicoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Requisições de Compra</CardTitle><CardDescription>Solicitações cadastradas no Omie</CardDescription></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReq ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={FileText} title="Acesse pelo Bitrix24" />
              ) : reqList.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhuma requisição encontrada" description="Requisições do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reqList.map((r: any, idx: number) => (
                      <TableRow key={r.nCodReq || idx}>
                        <TableCell className="font-medium">{r.nCodReq || r.codigo || "-"}</TableCell>
                        <TableCell>{r.cDescricao || r.descricao || "-"}</TableCell>
                        <TableCell>{r.dDtReq || r.data || "-"}</TableCell>
                        <TableCell><Badge variant="outline">{r.cStatus || r.status || "-"}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pedidos de Compra</CardTitle><CardDescription>Pedidos enviados aos fornecedores</CardDescription></CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : pedList.length === 0 ? (
                <EmptyState icon={Truck} title="Nenhum pedido de compra" description="Pedidos do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Pedido</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Etapa</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedList.map((p: any, idx: number) => {
                      const cab = p.cabecalho || p;
                      return (
                        <TableRow key={cab.nCodPedido || idx}>
                          <TableCell className="font-medium">{cab.nNumeroPedido || cab.nCodPedido || "-"}</TableCell>
                          <TableCell>{cab.nCodFornec || cab.codigo_fornecedor || "-"}</TableCell>
                          <TableCell>{cab.dDtPedido || cab.data || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{cab.cEtapa || "-"}</Badge></TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(cab.nValorTotal || cab.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Notas de Entrada</CardTitle><CardDescription>Recebimento de mercadorias</CardDescription></CardHeader>
            <CardContent>
              {loadingNotas ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : notasList.length === 0 ? (
                <EmptyState icon={Package} title="Nenhuma nota de entrada" description="Notas de entrada do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº NF</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notasList.map((n: any, idx: number) => (
                      <TableRow key={n.nCodNFe || idx}>
                        <TableCell className="font-medium">{n.nNF || n.numero_nf || "-"}</TableCell>
                        <TableCell>{n.nCodFornec || n.codigo_fornecedor || "-"}</TableCell>
                        <TableCell>{n.dDtEmissao || n.data_emissao || "-"}</TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(n.nValorTotal || n.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
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

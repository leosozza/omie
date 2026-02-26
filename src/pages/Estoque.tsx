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
  Package,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Estoque() {
  const { memberId } = useTenant();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: posicao, isLoading: loadingPosicao, refetch, isFetching } = useQuery({
    queryKey: ["estoque-posicao", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-estoque", {
        body: { tenant_id: memberId, action: "listar_posicao", data: { pagina: 1, registros_por_pagina: 100 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: abaixoMinimo, isLoading: loadingMinimo } = useQuery({
    queryKey: ["estoque-minimo", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-estoque", {
        body: { tenant_id: memberId, action: "listar_produtos_abaixo_minimo", data: {} },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: movimentos, isLoading: loadingMovimentos } = useQuery({
    queryKey: ["estoque-movimentos", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const hoje = new Date().toISOString().split("T")[0];
      const mesPassado = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data, error } = await supabase.functions.invoke("omie-estoque", {
        body: { tenant_id: memberId, action: "listar_movimentos", data: { data_inicio: mesPassado, data_fim: hoje, pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const produtos = posicao?.data?.produtos || posicao?.data?.posicao_estoque || [];
  const produtosMinimo = abaixoMinimo?.data?.produtos || [];
  const movimentosList = movimentos?.data?.movimentos || movimentos?.data?.movimento_estoque || [];

  const filteredProdutos = produtos.filter((p: any) => {
    const term = searchTerm.toLowerCase();
    return !term || String(p.cDescricao || p.descricao || p.cCodigo || "").toLowerCase().includes(term);
  });

  const totalProdutos = produtos.length;
  const totalAbaixoMinimo = produtosMinimo.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Package className="h-8 w-8 text-primary" /></div>
            Estoque
          </h1>
          <p className="mt-1 text-muted-foreground">Gestão de estoque, reservas e movimentações integradas com Omie</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Atualizar Posição
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Produtos em Estoque" value={String(totalProdutos)} icon={Boxes} variant="info" description="Cadastrados" />
        <StatsCard title="Abaixo do Mínimo" value={String(totalAbaixoMinimo)} icon={AlertTriangle} variant={totalAbaixoMinimo > 0 ? "warning" : "default"} description="Precisam reposição" />
        <StatsCard title="Movimentações" value={String(movimentosList.length)} icon={ArrowUpDown} variant="success" description="Últimos 30 dias" />
        <StatsCard title="Reservas Ativas" value="—" icon={Package} variant="default" description="Via pedidos" />
      </div>

      <Tabs defaultValue="posicao" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="posicao" className="gap-2"><Boxes className="h-4 w-4" />Posição</TabsTrigger>
          <TabsTrigger value="minimo" className="gap-2"><AlertTriangle className="h-4 w-4" />Mínimo</TabsTrigger>
          <TabsTrigger value="movimentos" className="gap-2"><ArrowUpDown className="h-4 w-4" />Movimentos</TabsTrigger>
        </TabsList>

        <TabsContent value="posicao" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Posição de Estoque</CardTitle><CardDescription>Quantidade disponível por produto</CardDescription></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPosicao ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={Package} title="Acesse pelo Bitrix24" />
              ) : filteredProdutos.length === 0 ? (
                <EmptyState icon={Package} title="Nenhum produto em estoque" description="Configure a integração com o Omie para visualizar o estoque" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProdutos.map((p: any, idx: number) => {
                      const saldo = Number(p.nSaldo || p.saldo || p.nQtdePosicao || 0);
                      const minimo = Number(p.nEstoqueMinimo || p.estoque_minimo || 0);
                      const abaixo = minimo > 0 && saldo < minimo;
                      return (
                        <TableRow key={p.nCodProd || p.codigo_produto || idx}>
                          <TableCell className="font-medium">{p.cCodigo || p.codigo || p.nCodProd || "-"}</TableCell>
                          <TableCell>{p.cDescricao || p.descricao || "-"}</TableCell>
                          <TableCell className="text-right font-medium">{saldo}</TableCell>
                          <TableCell className="text-right">{minimo || "-"}</TableCell>
                          <TableCell>
                            {abaixo ? (
                              <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Baixo</Badge>
                            ) : (
                              <Badge variant="outline">OK</Badge>
                            )}
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

        <TabsContent value="minimo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Produtos Abaixo do Mínimo</CardTitle>
              <CardDescription>Produtos que precisam de reposição urgente</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMinimo ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : produtosMinimo.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Nenhum produto abaixo do mínimo" description="✅ Todos os produtos estão com estoque adequado" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Saldo Atual</TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Faltam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosMinimo.map((p: any, idx: number) => {
                      const saldo = Number(p.nSaldo || 0);
                      const minimo = Number(p.nEstoqueMinimo || 0);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{p.cCodigo || p.nCodProd || "-"}</TableCell>
                          <TableCell>{p.cDescricao || "-"}</TableCell>
                          <TableCell className="text-right text-destructive font-medium">{saldo}</TableCell>
                          <TableCell className="text-right">{minimo}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">{minimo - saldo}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Movimentações de Estoque</CardTitle><CardDescription>Últimos 30 dias de entradas e saídas</CardDescription></CardHeader>
            <CardContent>
              {loadingMovimentos ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : movimentosList.length === 0 ? (
                <EmptyState icon={ArrowUpDown} title="Nenhuma movimentação registrada" description="Movimentações de estoque aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Qtde</TableHead>
                      <TableHead>Observação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentosList.map((m: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{m.dDtMov || m.data || "-"}</TableCell>
                        <TableCell>{m.cDescProd || m.descricao || m.nCodProd || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={m.cTipoMov === "E" || m.tipo === "E" ? "default" : "secondary"}>
                            {m.cTipoMov === "E" || m.tipo === "E" ? "Entrada" : "Saída"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{m.nQtde || m.quantidade || 0}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{m.cObs || m.observacao || "-"}</TableCell>
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

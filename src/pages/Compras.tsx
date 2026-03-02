import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, FileText, Package, RefreshCw, Clock, CreditCard, Settings } from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";
import { ComprasRequisicoes } from "@/components/compras/ComprasRequisicoes";
import { ComprasPedidos } from "@/components/compras/ComprasPedidos";
import { ComprasEntradas } from "@/components/compras/ComprasEntradas";
import { ComprasConfig } from "@/components/compras/ComprasConfig";
import { ComprasContasPagar } from "@/components/compras/ComprasContasPagar";

export default function Compras() {
  const { memberId } = useTenant();

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
          <p className="mt-1 text-muted-foreground">Requisições, pedidos de compra, contas a pagar e notas de entrada integrados com Omie</p>
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
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="requisicoes" className="gap-2"><FileText className="h-4 w-4" />Requisições</TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2"><Truck className="h-4 w-4" />Pedidos</TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2"><Package className="h-4 w-4" />Entradas</TabsTrigger>
          <TabsTrigger value="contas_pagar" className="gap-2"><CreditCard className="h-4 w-4" />Contas a Pagar</TabsTrigger>
          <TabsTrigger value="config" className="gap-2"><Settings className="h-4 w-4" />Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="requisicoes" className="space-y-4">
          <ComprasRequisicoes reqList={reqList} loading={loadingReq} memberId={memberId} />
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <ComprasPedidos pedList={pedList} loading={loadingPedidos} />
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <ComprasEntradas notasList={notasList} loading={loadingNotas} />
        </TabsContent>

        <TabsContent value="contas_pagar" className="space-y-4">
          <ComprasContasPagar memberId={memberId} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <ComprasConfig memberId={memberId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

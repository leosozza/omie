import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  FileText,
  Package,
  RefreshCw,
  Plus,
  Search,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Vendas() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-vendas/20">
              <ShoppingCart className="h-8 w-8 text-module-vendas" />
            </div>
            <span className="text-gradient-omie">Vendas</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Pedidos de venda, orçamentos e faturamento integrados com Omie
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <Plus className="h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Vendas Hoje"
          value="R$ 12.450"
          icon={TrendingUp}
          variant="success"
          description="8 pedidos"
          trend={{ value: 15, label: "vs ontem", isPositive: true }}
        />
        <StatsCard
          title="Pedidos Pendentes"
          value="23"
          icon={Clock}
          variant="warning"
          description="Aguardando faturamento"
        />
        <StatsCard
          title="NF-e Emitidas"
          value="156"
          icon={FileText}
          variant="info"
          description="Este mês"
        />
        <StatsCard
          title="Ticket Médio"
          value="R$ 1.556"
          icon={ShoppingCart}
          variant="default"
          description="Média mensal"
          trend={{ value: 8, label: "vs mês anterior", isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pedidos" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pedidos" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="gap-2">
            <FileText className="h-4 w-4" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="nfe" className="gap-2">
            <Package className="h-4 w-4" />
            NF-e
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pedidos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pedidos de Venda</CardTitle>
                  <CardDescription>Pedidos sincronizados com Omie</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar pedido..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum pedido encontrado</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para visualizar os pedidos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orcamentos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Orçamentos</CardTitle>
              <CardDescription>Propostas comerciais pendentes de aprovação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhum orçamento pendente</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Orçamentos criados no Bitrix24 aparecerão aqui
                </p>
                <Button variant="outline">
                  Criar Orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfe" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Notas Fiscais Eletrônicas</CardTitle>
              <CardDescription>NF-e emitidas via Omie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma NF-e encontrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para visualizar as notas fiscais
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

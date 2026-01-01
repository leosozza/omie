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
              <div className="space-y-3">
                {[
                  { id: "PV-001234", cliente: "Empresa ABC Ltda", valor: 5200, data: "2024-01-15", status: "faturado" },
                  { id: "PV-001235", cliente: "João Silva ME", valor: 1800, data: "2024-01-15", status: "pendente" },
                  { id: "PV-001236", cliente: "Tech Solutions", valor: 12500, data: "2024-01-14", status: "faturando" },
                  { id: "PV-001237", cliente: "Distribuidora 123", valor: 8900, data: "2024-01-14", status: "faturado" },
                ].map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        pedido.status === "faturado" ? "bg-module-financas/20" :
                        pedido.status === "faturando" ? "bg-module-vendas/20" :
                        "bg-muted"
                      }`}>
                        {pedido.status === "faturado" ? (
                          <CheckCircle2 className="h-5 w-5 text-module-financas" />
                        ) : pedido.status === "faturando" ? (
                          <RefreshCw className="h-5 w-5 text-module-vendas animate-spin" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{pedido.id}</p>
                          <Badge variant={
                            pedido.status === "faturado" ? "default" :
                            pedido.status === "faturando" ? "secondary" :
                            "outline"
                          }>
                            {pedido.status === "faturado" ? "Faturado" :
                             pedido.status === "faturando" ? "Faturando" :
                             "Pendente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pedido.cliente}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {pedido.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(pedido.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {pedido.status === "faturado" && (
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-3">
                {[
                  { numero: "000123456", cliente: "Empresa ABC Ltda", valor: 5200, data: "2024-01-15", status: "autorizada" },
                  { numero: "000123455", cliente: "Distribuidora 123", valor: 8900, data: "2024-01-14", status: "autorizada" },
                  { numero: "000123454", cliente: "Tech Solutions", valor: 3200, data: "2024-01-13", status: "cancelada" },
                ].map((nfe) => (
                  <div
                    key={nfe.numero}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${nfe.status === "cancelada" ? "bg-destructive/20" : "bg-module-financas/20"}`}>
                        <FileText className={`h-5 w-5 ${nfe.status === "cancelada" ? "text-destructive" : "text-module-financas"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">NF-e {nfe.numero}</p>
                          <Badge variant={nfe.status === "cancelada" ? "destructive" : "default"}>
                            {nfe.status === "cancelada" ? "Cancelada" : "Autorizada"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{nfe.cliente}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {nfe.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(nfe.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

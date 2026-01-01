import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  BarChart3,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-estoque/20">
              <Package className="h-8 w-8 text-module-estoque" />
            </div>
            <span className="text-gradient-omie">Estoque</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestão de estoque, reservas e movimentações integradas com Omie
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Posição
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total em Estoque"
          value="R$ 245.800"
          icon={Boxes}
          variant="info"
          description="1.234 produtos"
        />
        <StatsCard
          title="Abaixo do Mínimo"
          value="18"
          icon={AlertTriangle}
          variant="warning"
          description="Produtos críticos"
        />
        <StatsCard
          title="Reservas Ativas"
          value="45"
          icon={Package}
          variant="default"
          description="Para pedidos"
        />
        <StatsCard
          title="Movimentações Hoje"
          value="89"
          icon={ArrowUpDown}
          variant="success"
          description="Entradas e saídas"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posicao" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="posicao" className="gap-2">
            <Boxes className="h-4 w-4" />
            Posição
          </TabsTrigger>
          <TabsTrigger value="minimo" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Mínimo
          </TabsTrigger>
          <TabsTrigger value="movimentos" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Movimentos
          </TabsTrigger>
          <TabsTrigger value="reservas" className="gap-2">
            <Package className="h-4 w-4" />
            Reservas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posicao" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Posição de Estoque</CardTitle>
                  <CardDescription>Quantidade disponível por produto</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar produto..."
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
                  { codigo: "PROD-001", nome: "Notebook Dell Inspiron", quantidade: 45, minimo: 10, maximo: 100, custo: 2500 },
                  { codigo: "PROD-002", nome: "Mouse Logitech MX Master", quantidade: 120, minimo: 30, maximo: 200, custo: 450 },
                  { codigo: "PROD-003", nome: "Teclado Mecânico RGB", quantidade: 8, minimo: 20, maximo: 80, custo: 350 },
                  { codigo: "PROD-004", nome: "Monitor LG 27\"", quantidade: 32, minimo: 15, maximo: 60, custo: 1800 },
                ].map((produto) => {
                  const percentual = (produto.quantidade / produto.maximo) * 100;
                  const isCritico = produto.quantidade < produto.minimo;
                  
                  return (
                    <div
                      key={produto.codigo}
                      className="p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCritico ? "bg-destructive/20" : "bg-module-estoque/20"}`}>
                            <Package className={`h-5 w-5 ${isCritico ? "text-destructive" : "text-module-estoque"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{produto.nome}</p>
                              {isCritico && (
                                <Badge variant="destructive">Crítico</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{produto.codigo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{produto.quantidade} un</p>
                          <p className="text-sm text-muted-foreground">
                            {(produto.quantidade * produto.custo).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Mín: {produto.minimo}</span>
                          <span>Máx: {produto.maximo}</span>
                        </div>
                        <Progress 
                          value={percentual} 
                          className={`h-2 ${isCritico ? "[&>div]:bg-destructive" : "[&>div]:bg-module-estoque"}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="minimo" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Produtos Abaixo do Mínimo
              </CardTitle>
              <CardDescription>Produtos que precisam de reposição urgente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { codigo: "PROD-003", nome: "Teclado Mecânico RGB", quantidade: 8, minimo: 20 },
                  { codigo: "PROD-012", nome: "Cabo HDMI 2.1", quantidade: 5, minimo: 50 },
                  { codigo: "PROD-023", nome: "SSD NVMe 1TB", quantidade: 3, minimo: 15 },
                ].map((produto) => (
                  <div
                    key={produto.codigo}
                    className="flex items-center justify-between p-4 rounded-lg border border-destructive/30 bg-destructive/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-sm text-muted-foreground">{produto.codigo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-destructive">{produto.quantidade} un</p>
                        <p className="text-sm text-muted-foreground">Mínimo: {produto.minimo}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Criar Requisição
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Movimentações de Estoque</CardTitle>
              <CardDescription>Histórico de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { tipo: "entrada", produto: "Notebook Dell Inspiron", quantidade: 20, data: "2024-01-15 14:30", origem: "NF-e 123456" },
                  { tipo: "saida", produto: "Mouse Logitech MX Master", quantidade: 5, data: "2024-01-15 12:15", origem: "PV-001234" },
                  { tipo: "saida", produto: "Monitor LG 27\"", quantidade: 2, data: "2024-01-15 10:00", origem: "PV-001233" },
                  { tipo: "entrada", produto: "Teclado Mecânico RGB", quantidade: 50, data: "2024-01-14 16:45", origem: "NF-e 123450" },
                ].map((mov, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${mov.tipo === "entrada" ? "bg-module-financas/20" : "bg-module-vendas/20"}`}>
                        {mov.tipo === "entrada" ? (
                          <TrendingUp className="h-5 w-5 text-module-financas" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-module-vendas" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{mov.produto}</p>
                        <p className="text-sm text-muted-foreground">{mov.origem}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${mov.tipo === "entrada" ? "text-module-financas" : "text-module-vendas"}`}>
                        {mov.tipo === "entrada" ? "+" : "-"}{mov.quantidade} un
                      </p>
                      <p className="text-sm text-muted-foreground">{mov.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Reservas de Estoque</CardTitle>
              <CardDescription>Produtos reservados para pedidos em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { pedido: "PV-001235", produto: "Mouse Logitech MX Master", quantidade: 10, cliente: "João Silva ME" },
                  { pedido: "PV-001236", produto: "Monitor LG 27\"", quantidade: 5, cliente: "Tech Solutions" },
                ].map((reserva, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{reserva.produto}</p>
                        <p className="text-sm text-muted-foreground">
                          {reserva.pedido} - {reserva.cliente}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{reserva.quantidade} un reservados</Badge>
                      <Button size="sm" variant="ghost">
                        Liberar
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

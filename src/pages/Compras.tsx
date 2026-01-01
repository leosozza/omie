import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  FileText,
  Package,
  RefreshCw,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-compras/20">
              <Truck className="h-8 w-8 text-module-compras" />
            </div>
            <span className="text-gradient-omie">Compras</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Requisições, pedidos de compra e notas de entrada integrados com Omie
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <Plus className="h-4 w-4" />
            Nova Requisição
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Requisições Pendentes"
          value="12"
          icon={FileText}
          variant="warning"
          description="Aguardando aprovação"
        />
        <StatsCard
          title="Pedidos em Aberto"
          value="8"
          icon={Truck}
          variant="info"
          description="Aguardando entrega"
        />
        <StatsCard
          title="Entradas Este Mês"
          value="R$ 89.500"
          icon={Package}
          variant="success"
          description="45 notas"
        />
        <StatsCard
          title="Prazo Médio"
          value="12 dias"
          icon={Clock}
          variant="default"
          description="Lead time fornecedores"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="requisicoes" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="requisicoes" className="gap-2">
            <FileText className="h-4 w-4" />
            Requisições
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2">
            <Truck className="h-4 w-4" />
            Pedidos
          </TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2">
            <Package className="h-4 w-4" />
            Entradas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requisicoes" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Requisições de Compra</CardTitle>
                  <CardDescription>Solicitações de compra pendentes</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
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
                  { id: "REQ-001", descricao: "Reposição de estoque - Notebooks", solicitante: "João Silva", data: "2024-01-15", status: "pendente" },
                  { id: "REQ-002", descricao: "Material de escritório", solicitante: "Maria Santos", data: "2024-01-14", status: "aprovada" },
                  { id: "REQ-003", descricao: "Equipamentos de TI", solicitante: "Pedro Costa", data: "2024-01-13", status: "rejeitada" },
                ].map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        req.status === "aprovada" ? "bg-module-financas/20" :
                        req.status === "rejeitada" ? "bg-destructive/20" :
                        "bg-muted"
                      }`}>
                        {req.status === "aprovada" ? (
                          <CheckCircle2 className="h-5 w-5 text-module-financas" />
                        ) : req.status === "rejeitada" ? (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{req.id}</p>
                          <Badge variant={
                            req.status === "aprovada" ? "default" :
                            req.status === "rejeitada" ? "destructive" :
                            "secondary"
                          }>
                            {req.status === "aprovada" ? "Aprovada" :
                             req.status === "rejeitada" ? "Rejeitada" :
                             "Pendente"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{req.descricao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm">{req.solicitante}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(req.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      {req.status === "pendente" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-module-financas">
                            Aprovar
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive">
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Pedidos de Compra</CardTitle>
              <CardDescription>Pedidos enviados aos fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: "PC-001234", fornecedor: "Distribuidora XYZ", valor: 15200, data: "2024-01-10", previsao: "2024-01-20", status: "transito" },
                  { id: "PC-001233", fornecedor: "Tech Supplies", valor: 8900, data: "2024-01-08", previsao: "2024-01-18", status: "confirmado" },
                  { id: "PC-001232", fornecedor: "Importadora ABC", valor: 45000, data: "2024-01-05", previsao: "2024-02-01", status: "producao" },
                ].map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-compras/20">
                        <Truck className="h-5 w-5 text-module-compras" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{pedido.id}</p>
                          <Badge variant={
                            pedido.status === "transito" ? "default" :
                            pedido.status === "producao" ? "secondary" :
                            "outline"
                          }>
                            {pedido.status === "transito" ? "Em trânsito" :
                             pedido.status === "producao" ? "Em produção" :
                             "Confirmado"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{pedido.fornecedor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {pedido.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Previsão: {new Date(pedido.previsao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Notas de Entrada</CardTitle>
              <CardDescription>Recebimento de mercadorias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nfe: "000123456", fornecedor: "Distribuidora XYZ", valor: 15200, data: "2024-01-15", itens: 25 },
                  { nfe: "000123450", fornecedor: "Tech Supplies", valor: 8900, data: "2024-01-12", itens: 12 },
                ].map((entrada) => (
                  <div
                    key={entrada.nfe}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-financas/20">
                        <Package className="h-5 w-5 text-module-financas" />
                      </div>
                      <div>
                        <p className="font-medium">NF-e {entrada.nfe}</p>
                        <p className="text-sm text-muted-foreground">{entrada.fornecedor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {entrada.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entrada.itens} itens • {new Date(entrada.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge variant="secondary">Conferida</Badge>
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

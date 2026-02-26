import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Boxes,
  AlertTriangle,
  RefreshCw,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Estoque() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Package className="h-8 w-8 text-primary" />
            </div>
            Estoque
          </h1>
          <p className="mt-1 text-muted-foreground">Gestão de estoque, reservas e movimentações integradas com Omie</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Atualizar Posição</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total em Estoque" value="R$ 0" icon={Boxes} variant="info" description="0 produtos" />
        <StatsCard title="Abaixo do Mínimo" value="0" icon={AlertTriangle} variant="warning" description="Produtos críticos" />
        <StatsCard title="Reservas Ativas" value="0" icon={Package} variant="default" description="Para pedidos" />
        <StatsCard title="Movimentações Hoje" value="0" icon={ArrowUpDown} variant="success" description="Entradas e saídas" />
      </div>

      <Tabs defaultValue="posicao" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="posicao" className="gap-2"><Boxes className="h-4 w-4" />Posição</TabsTrigger>
          <TabsTrigger value="minimo" className="gap-2"><AlertTriangle className="h-4 w-4" />Mínimo</TabsTrigger>
          <TabsTrigger value="movimentos" className="gap-2"><ArrowUpDown className="h-4 w-4" />Movimentos</TabsTrigger>
          <TabsTrigger value="reservas" className="gap-2"><Package className="h-4 w-4" />Reservas</TabsTrigger>
        </TabsList>

        <TabsContent value="posicao" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Posição de Estoque</CardTitle>
                  <CardDescription>Quantidade disponível por produto</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum produto em estoque</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Configure a integração com o Omie para visualizar o estoque</p>
              </div>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum produto abaixo do mínimo</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Produtos críticos aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Movimentações de Estoque</CardTitle><CardDescription>Histórico de entradas e saídas</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowUpDown className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma movimentação registrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Movimentações de estoque aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reservas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Reservas de Estoque</CardTitle><CardDescription>Produtos reservados para pedidos em andamento</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma reserva ativa</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Reservas de estoque aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

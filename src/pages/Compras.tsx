import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  FileText,
  Package,
  RefreshCw,
  Search,
  Plus,
  Clock,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            Compras
          </h1>
          <p className="mt-1 text-muted-foreground">Requisições, pedidos de compra e notas de entrada integrados com Omie</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Sincronizar</Button>
          <Button className="gap-2"><Plus className="h-4 w-4" />Nova Requisição</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Requisições Pendentes" value="0" icon={FileText} variant="warning" description="Aguardando aprovação" />
        <StatsCard title="Pedidos em Aberto" value="0" icon={Truck} variant="info" description="Aguardando entrega" />
        <StatsCard title="Entradas Este Mês" value="R$ 0" icon={Package} variant="success" description="0 notas" />
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
                <div>
                  <CardTitle>Requisições de Compra</CardTitle>
                  <CardDescription>Solicitações de compra pendentes</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma requisição encontrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Configure a integração com o Omie para visualizar requisições</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Pedidos de Compra</CardTitle><CardDescription>Pedidos enviados aos fornecedores</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Truck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum pedido de compra</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Pedidos de compra aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entradas" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Notas de Entrada</CardTitle><CardDescription>Recebimento de mercadorias</CardDescription></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma nota de entrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Notas de entrada aparecerão aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

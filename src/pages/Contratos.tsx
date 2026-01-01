import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  RefreshCw,
  Search,
  Plus,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Contratos() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-servicos/20">
              <FileText className="h-8 w-8 text-module-servicos" />
            </div>
            <span className="text-gradient-omie">Contratos</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestão de contratos de serviço e faturamento recorrente via Omie
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Play className="h-4 w-4" />
            Faturar Lote
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <Plus className="h-4 w-4" />
            Novo Contrato
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Contratos Ativos"
          value="78"
          icon={FileText}
          variant="success"
          description="Em vigência"
        />
        <StatsCard
          title="MRR"
          value="R$ 156.800"
          icon={DollarSign}
          variant="info"
          description="Receita recorrente"
          trend={{ value: 8, label: "vs mês anterior", isPositive: true }}
        />
        <StatsCard
          title="Renovações"
          value="12"
          icon={Calendar}
          variant="warning"
          description="Próximos 30 dias"
        />
        <StatsCard
          title="Pendentes Faturar"
          value="23"
          icon={Clock}
          variant="default"
          description="Este mês"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ativos" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="ativos" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Ativos
          </TabsTrigger>
          <TabsTrigger value="renovar" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Renovar
          </TabsTrigger>
          <TabsTrigger value="faturar" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Faturar
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <Calendar className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contratos Ativos</CardTitle>
                  <CardDescription>Contratos de serviço em vigência</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contrato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum contrato ativo</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para visualizar os contratos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renovar" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Contratos para Renovar
              </CardTitle>
              <CardDescription>Contratos com vencimento próximo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum contrato para renovar</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Contratos próximos do vencimento aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faturar" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Faturamento Pendente</CardTitle>
                  <CardDescription>Contratos prontos para faturar este mês</CardDescription>
                </div>
                <Button className="gap-2">
                  <Play className="h-4 w-4" />
                  Faturar Todos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum contrato pendente</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Contratos prontos para faturar aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Histórico de Faturamento</CardTitle>
              <CardDescription>NFS-e emitidas para contratos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma NFS-e no histórico</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  NFS-e emitidas para contratos aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

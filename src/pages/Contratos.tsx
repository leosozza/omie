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
          trend={{ value: 8, isPositive: true }}
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
              <div className="space-y-3">
                {[
                  { id: "CTR-001", cliente: "Tech Solutions S.A.", servico: "Suporte Premium 24/7", valor: 8500, vencimento: "2024-12-31", status: "ativo" },
                  { id: "CTR-002", cliente: "Empresa ABC Ltda", servico: "Manutenção Mensal", valor: 3200, vencimento: "2024-06-15", status: "ativo" },
                  { id: "CTR-003", cliente: "Distribuidora 123", servico: "Consultoria TI", valor: 12000, vencimento: "2024-03-01", status: "renovar" },
                ].map((contrato) => (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${contrato.status === "renovar" ? "bg-warning/20" : "bg-module-servicos/20"}`}>
                        <FileText className={`h-5 w-5 ${contrato.status === "renovar" ? "text-warning" : "text-module-servicos"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contrato.id}</p>
                          {contrato.status === "renovar" && (
                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                              Renovar
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium">{contrato.cliente}</p>
                        <p className="text-sm text-muted-foreground">{contrato.servico}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {contrato.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Vigência até {new Date(contrato.vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Faturar
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-3">
                {[
                  { id: "CTR-003", cliente: "Distribuidora 123", servico: "Consultoria TI", valor: 12000, vencimento: "2024-03-01", diasRestantes: 45 },
                  { id: "CTR-008", cliente: "Startup XYZ", servico: "Desenvolvimento", valor: 25000, vencimento: "2024-02-15", diasRestantes: 30 },
                ].map((contrato) => (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-warning/30 bg-warning/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-warning/20">
                        <Calendar className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="font-medium">{contrato.cliente}</p>
                        <p className="text-sm text-muted-foreground">{contrato.servico}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {contrato.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês
                        </p>
                        <Badge variant="secondary" className="bg-warning/20 text-warning">
                          {contrato.diasRestantes} dias restantes
                        </Badge>
                      </div>
                      <Button size="sm">
                        Renovar
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-3">
                {[
                  { id: "CTR-001", cliente: "Tech Solutions S.A.", valor: 8500, competencia: "Janeiro/2024" },
                  { id: "CTR-002", cliente: "Empresa ABC Ltda", valor: 3200, competencia: "Janeiro/2024" },
                  { id: "CTR-005", cliente: "Indústria XYZ", valor: 15800, competencia: "Janeiro/2024" },
                ].map((contrato) => (
                  <div
                    key={contrato.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-financas/20">
                        <DollarSign className="h-5 w-5 text-module-financas" />
                      </div>
                      <div>
                        <p className="font-medium">{contrato.cliente}</p>
                        <p className="text-sm text-muted-foreground">{contrato.competencia}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">
                        {contrato.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <Button size="sm" variant="outline">
                        Faturar
                      </Button>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-3">
                {[
                  { nfse: "000001234", cliente: "Tech Solutions S.A.", valor: 8500, data: "2024-01-05", status: "autorizada" },
                  { nfse: "000001233", cliente: "Empresa ABC Ltda", valor: 3200, data: "2024-01-05", status: "autorizada" },
                  { nfse: "000001230", cliente: "Tech Solutions S.A.", valor: 8500, data: "2023-12-05", status: "autorizada" },
                ].map((nfse, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-financas/20">
                        <CheckCircle2 className="h-5 w-5 text-module-financas" />
                      </div>
                      <div>
                        <p className="font-medium">NFS-e {nfse.nfse}</p>
                        <p className="text-sm text-muted-foreground">{nfse.cliente}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {nfse.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(nfse.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Badge>Autorizada</Badge>
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

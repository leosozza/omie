import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Building2,
  Target,
  RefreshCw,
  Search,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-crm/20">
              <Users className="h-8 w-8 text-module-crm" />
            </div>
            <span className="text-gradient-omie">CRM</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sincronização bidirecional entre Bitrix24 e Omie CRM
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Sincronizar Agora
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Contatos Sincronizados"
          value="1.234"
          icon={Users}
          variant="info"
          description="Total no sistema"
        />
        <StatsCard
          title="Empresas"
          value="456"
          icon={Building2}
          variant="default"
          description="Contas ativas"
        />
        <StatsCard
          title="Oportunidades"
          value="89"
          icon={Target}
          variant="success"
          description="Em andamento"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Pipeline"
          value="R$ 2.5M"
          icon={DollarSign}
          variant="warning"
          description="Valor total"
        />
      </div>

      {/* Sync Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Sincronização Bidirecional Ativa</p>
              <p className="text-sm text-muted-foreground">Última sincronização: há 5 minutos</p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Sincronizado
          </Badge>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="contatos" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="contatos" className="gap-2">
            <Users className="h-4 w-4" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="oportunidades" className="gap-2">
            <Target className="h-4 w-4" />
            Oportunidades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contatos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contatos</CardTitle>
                  <CardDescription>Contatos sincronizados Bitrix24 ↔ Omie</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contato..."
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
                  { nome: "João Silva", email: "joao@empresa.com", empresa: "Empresa ABC", status: "sync" },
                  { nome: "Maria Santos", email: "maria@tech.com", empresa: "Tech Solutions", status: "sync" },
                  { nome: "Pedro Costa", email: "pedro@dist.com", empresa: "Distribuidora 123", status: "pending" },
                  { nome: "Ana Oliveira", email: "ana@startup.io", empresa: "Startup XYZ", status: "sync" },
                ].map((contato, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-module-crm/20 text-module-crm">
                          {contato.nome.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{contato.nome}</p>
                          {contato.status === "sync" ? (
                            <CheckCircle2 className="h-4 w-4 text-module-financas" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contato.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{contato.empresa}</Badge>
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresas" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>Contas sincronizadas Bitrix24 ↔ Omie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nome: "Empresa ABC Ltda", cnpj: "12.345.678/0001-90", cidade: "São Paulo", status: "sync" },
                  { nome: "Tech Solutions S.A.", cnpj: "98.765.432/0001-10", cidade: "Rio de Janeiro", status: "sync" },
                  { nome: "Distribuidora 123", cnpj: "11.222.333/0001-44", cidade: "Belo Horizonte", status: "sync" },
                ].map((empresa, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-crm/20">
                        <Building2 className="h-5 w-5 text-module-crm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{empresa.nome}</p>
                          <CheckCircle2 className="h-4 w-4 text-module-financas" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {empresa.cnpj} • {empresa.cidade}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Oportunidades</CardTitle>
              <CardDescription>Pipeline de vendas sincronizado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { nome: "Projeto Enterprise", empresa: "Tech Solutions", valor: 150000, fase: "Proposta", prob: 60 },
                  { nome: "Licenciamento Anual", empresa: "Empresa ABC", valor: 45000, fase: "Negociação", prob: 80 },
                  { nome: "Consultoria TI", empresa: "Distribuidora 123", valor: 28000, fase: "Qualificação", prob: 30 },
                ].map((opp, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-module-vendas/20">
                        <Target className="h-5 w-5 text-module-vendas" />
                      </div>
                      <div>
                        <p className="font-medium">{opp.nome}</p>
                        <p className="text-sm text-muted-foreground">{opp.empresa}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {opp.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{opp.fase}</Badge>
                          <span className="text-sm text-muted-foreground">{opp.prob}%</span>
                        </div>
                      </div>
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

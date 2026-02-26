import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Target,
  RefreshCw,
  Search,
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            CRM
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Contatos Sincronizados" value="0" icon={Users} variant="info" description="Total no sistema" />
        <StatsCard title="Empresas" value="0" icon={Building2} variant="default" description="Contas ativas" />
        <StatsCard title="Oportunidades" value="0" icon={Target} variant="success" description="Em andamento" />
        <StatsCard title="Pipeline" value="R$ 0" icon={DollarSign} variant="warning" description="Valor total" />
      </div>

      {/* Sync Status */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Sincronização Bidirecional</p>
              <p className="text-sm text-muted-foreground">Configure a integração para ativar</p>
            </div>
          </div>
          <Badge variant="secondary">Aguardando</Badge>
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
          <Card>
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
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum contato sincronizado</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para sincronizar contatos
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Empresas</CardTitle>
              <CardDescription>Contas sincronizadas Bitrix24 ↔ Omie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma empresa sincronizada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para sincronizar empresas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades</CardTitle>
              <CardDescription>Pipeline de vendas sincronizado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma oportunidade sincronizada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para sincronizar oportunidades
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

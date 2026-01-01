import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wallet,
  CreditCard,
  QrCode,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Copy,
  Download,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Financas() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Generate Boleto
  const generateBoleto = useMutation({
    mutationFn: async (tituloId: string) => {
      const { data, error } = await supabase.functions.invoke("omie-boleto-pix", {
        body: { tenant_id: memberId, action: "gerar_boleto", titulo_id: tituloId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Boleto gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["titulos-receber"] });
    },
    onError: (error) => {
      toast.error(`Erro ao gerar boleto: ${error.message}`);
    },
  });

  // Generate PIX
  const generatePix = useMutation({
    mutationFn: async (tituloId: string) => {
      const { data, error } = await supabase.functions.invoke("omie-boleto-pix", {
        body: { tenant_id: memberId, action: "gerar_pix", titulo_id: tituloId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("QR Code PIX gerado!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PIX: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-financas/20">
              <Wallet className="h-8 w-8 text-module-financas" />
            </div>
            <span className="text-gradient-omie">Finanças</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestão financeira completa com Omie.Cash - Boletos, PIX e Fluxo de Caixa
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <Plus className="h-4 w-4" />
            Novo Título
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="A Receber"
          value="R$ 45.230"
          icon={ArrowUpCircle}
          variant="success"
          description="Próximos 30 dias"
          trend={{ value: 12, label: "vs mês anterior", isPositive: true }}
        />
        <StatsCard
          title="A Pagar"
          value="R$ 23.150"
          icon={ArrowDownCircle}
          variant="error"
          description="Próximos 30 dias"
          trend={{ value: 5, label: "vs mês anterior", isPositive: false }}
        />
        <StatsCard
          title="Boletos Pendentes"
          value="18"
          icon={CreditCard}
          variant="warning"
          description="Aguardando pagamento"
        />
        <StatsCard
          title="PIX Recebidos"
          value="R$ 8.420"
          icon={QrCode}
          variant="info"
          description="Este mês"
          trend={{ value: 23, label: "vs mês anterior", isPositive: true }}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="receber" className="gap-2">
            <ArrowUpCircle className="h-4 w-4" />
            A Receber
          </TabsTrigger>
          <TabsTrigger value="pagar" className="gap-2">
            <ArrowDownCircle className="h-4 w-4" />
            A Pagar
          </TabsTrigger>
          <TabsTrigger value="boletos" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Boletos
          </TabsTrigger>
          <TabsTrigger value="pix" className="gap-2">
            <QrCode className="h-4 w-4" />
            PIX
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Títulos pendentes de recebimento</CardDescription>
                </div>
                <div className="flex gap-2">
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
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Sample data - would come from API */}
                {[
                  { id: "1", cliente: "Empresa ABC Ltda", valor: 5200, vencimento: "2024-01-15", status: "aberto" },
                  { id: "2", cliente: "João Silva ME", valor: 1800, vencimento: "2024-01-10", status: "vencido" },
                  { id: "3", cliente: "Tech Solutions", valor: 12500, vencimento: "2024-01-20", status: "aberto" },
                ].map((titulo) => (
                  <div
                    key={titulo.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${titulo.status === "vencido" ? "bg-destructive/20" : "bg-module-financas/20"}`}>
                        <DollarSign className={`h-5 w-5 ${titulo.status === "vencido" ? "text-destructive" : "text-module-financas"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{titulo.cliente}</p>
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {new Date(titulo.vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {titulo.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <Badge variant={titulo.status === "vencido" ? "destructive" : "secondary"}>
                          {titulo.status === "vencido" ? "Vencido" : "Em aberto"}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateBoleto.mutate(titulo.id)}
                          disabled={generateBoleto.isPending}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generatePix.mutate(titulo.id)}
                          disabled={generatePix.isPending}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Títulos pendentes de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { id: "1", fornecedor: "Fornecedor XYZ", valor: 3200, vencimento: "2024-01-12", status: "aberto" },
                  { id: "2", fornecedor: "Distribuidora 123", valor: 8900, vencimento: "2024-01-18", status: "aberto" },
                ].map((titulo) => (
                  <div
                    key={titulo.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-destructive/20">
                        <ArrowDownCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">{titulo.fornecedor}</p>
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {new Date(titulo.vencimento).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {titulo.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <Badge variant="secondary">Em aberto</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-module-financas" />
                Boletos Omie.Cash
              </CardTitle>
              <CardDescription>Geração e gestão de boletos bancários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-background/30 text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar Boleto</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione um título na aba "A Receber" para gerar boleto
                  </p>
                  <Button variant="outline" disabled>
                    Selecionar Título
                  </Button>
                </div>
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-background/30 text-center">
                  <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Segunda Via</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Obtenha segunda via de boletos já emitidos
                  </p>
                  <Button variant="outline">
                    Consultar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pix" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-module-financas" />
                PIX Omie.Cash
              </CardTitle>
              <CardDescription>Geração de QR Code PIX para cobrança</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-background/30 text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar QR Code PIX</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Selecione um título na aba "A Receber" para gerar PIX
                  </p>
                  <Button variant="outline" disabled>
                    Selecionar Título
                  </Button>
                </div>
                <div className="p-6 rounded-xl border border-dashed border-border/50 bg-background/30 text-center">
                  <Copy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Copiar Código</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Copie o código PIX para enviar ao cliente
                  </p>
                  <Button variant="outline">
                    Consultar PIX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

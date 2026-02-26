import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Financas() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

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

  const generatePix = useMutation({
    mutationFn: async (tituloId: string) => {
      const { data, error } = await supabase.functions.invoke("omie-boleto-pix", {
        body: { tenant_id: memberId, action: "gerar_pix", titulo_id: tituloId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("QR Code PIX gerado!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar PIX: ${error.message}`);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            Finanças
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Título
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="A Receber" value="R$ 0" icon={ArrowUpCircle} variant="success" description="Próximos 30 dias" />
        <StatsCard title="A Pagar" value="R$ 0" icon={ArrowDownCircle} variant="error" description="Próximos 30 dias" />
        <StatsCard title="Boletos Pendentes" value="0" icon={CreditCard} variant="warning" description="Aguardando pagamento" />
        <StatsCard title="PIX Recebidos" value="R$ 0" icon={QrCode} variant="info" description="Este mês" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="receber" className="gap-2"><ArrowUpCircle className="h-4 w-4" />A Receber</TabsTrigger>
          <TabsTrigger value="pagar" className="gap-2"><ArrowDownCircle className="h-4 w-4" />A Pagar</TabsTrigger>
          <TabsTrigger value="boletos" className="gap-2"><CreditCard className="h-4 w-4" />Boletos</TabsTrigger>
          <TabsTrigger value="pix" className="gap-2"><QrCode className="h-4 w-4" />PIX</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>Títulos pendentes de recebimento</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum título a receber</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Configure a integração com o Omie para visualizar os títulos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>Títulos pendentes de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowDownCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhum título a pagar</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">Configure a integração com o Omie para visualizar os títulos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Boletos Omie.Cash
              </CardTitle>
              <CardDescription>Geração e gestão de boletos bancários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar Boleto</h3>
                  <p className="text-sm text-muted-foreground mb-4">Selecione um título na aba "A Receber" para gerar boleto</p>
                  <Button variant="outline" disabled>Selecionar Título</Button>
                </div>
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <Download className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Segunda Via</h3>
                  <p className="text-sm text-muted-foreground mb-4">Obtenha segunda via de boletos já emitidos</p>
                  <Button variant="outline">Consultar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                PIX Omie.Cash
              </CardTitle>
              <CardDescription>Geração de QR Code PIX para cobrança</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar QR Code PIX</h3>
                  <p className="text-sm text-muted-foreground mb-4">Selecione um título na aba "A Receber" para gerar PIX</p>
                  <Button variant="outline" disabled>Selecionar Título</Button>
                </div>
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <Copy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Copiar Código</h3>
                  <p className="text-sm text-muted-foreground mb-4">Copie o código PIX para enviar ao cliente</p>
                  <Button variant="outline">Consultar PIX</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

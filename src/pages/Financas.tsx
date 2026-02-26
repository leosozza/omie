import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Search,
  DollarSign,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Financas() {
  const { memberId } = useTenant();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [pixDialog, setPixDialog] = useState<{ open: boolean; qrCode?: string; copiaCola?: string }>({ open: false });
  const [selectedTitulo, setSelectedTitulo] = useState<string | null>(null);

  const { data: contasReceber, isLoading: loadingReceber, refetch: refetchReceber } = useQuery({
    queryKey: ["contas-receber", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-financas", {
        body: { tenant_id: memberId, action: "listar_contas_receber", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: contasPagar, isLoading: loadingPagar } = useQuery({
    queryKey: ["contas-pagar", memberId],
    queryFn: async () => {
      if (!memberId) return null;
      const { data, error } = await supabase.functions.invoke("omie-financas", {
        body: { tenant_id: memberId, action: "listar_contas_pagar", data: { pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const gerarBoletoMutation = useMutation({
    mutationFn: async (codigoLancamento: number) => {
      const { data, error } = await supabase.functions.invoke("omie-boleto-pix", {
        body: { tenant_id: memberId, action: "gerar_boleto", data: { codigo_lancamento_omie: codigoLancamento } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.data?.cLinkBoleto) {
        window.open(data.data.cLinkBoleto, "_blank");
        toast.success("Boleto gerado com sucesso!");
      } else {
        toast.success("Boleto processado!");
      }
    },
    onError: (e: Error) => toast.error(`Erro ao gerar boleto: ${e.message}`),
  });

  const gerarPixMutation = useMutation({
    mutationFn: async (codigoLancamento: number) => {
      const { data, error } = await supabase.functions.invoke("omie-boleto-pix", {
        body: { tenant_id: memberId, action: "gerar_pix", data: { codigo_lancamento_omie: codigoLancamento } },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const qr = data?.data?.cQrCode || data?.data?.qr_code_url;
      const cc = data?.data?.cCopiaCola || data?.data?.copia_cola;
      if (qr || cc) {
        setPixDialog({ open: true, qrCode: qr, copiaCola: cc });
        toast.success("PIX gerado com sucesso!");
      } else {
        toast.success("PIX processado!");
      }
    },
    onError: (e: Error) => toast.error(`Erro ao gerar PIX: ${e.message}`),
  });

  const receberList = contasReceber?.data?.conta_receber_cadastro || contasReceber?.data?.titulosEncontrados || [];
  const pagarList = contasPagar?.data?.conta_pagar_cadastro || contasPagar?.data?.titulosEncontrados || [];

  const totalReceber = receberList.reduce((acc: number, t: any) => acc + Number(t.valor_documento || t.nValorTitulo || 0), 0);
  const totalPagar = pagarList.reduce((acc: number, t: any) => acc + Number(t.valor_documento || t.nValorTitulo || 0), 0);
  const boletosPendentes = receberList.filter((t: any) => (t.status_titulo || t.cStatus) === "ABERTO").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Wallet className="h-8 w-8 text-primary" /></div>
            Finanças
          </h1>
          <p className="mt-1 text-muted-foreground">Gestão financeira completa com Omie.Cash — Boletos, PIX e Fluxo de Caixa</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => { refetchReceber(); }} disabled={loadingReceber}>
          <RefreshCw className={`h-4 w-4 ${loadingReceber ? "animate-spin" : ""}`} />Sincronizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="A Receber" value={`R$ ${totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={ArrowUpCircle} variant="success" description={`${receberList.length} títulos`} />
        <StatsCard title="A Pagar" value={`R$ ${totalPagar.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={ArrowDownCircle} variant="error" description={`${pagarList.length} títulos`} />
        <StatsCard title="Títulos em Aberto" value={String(boletosPendentes)} icon={CreditCard} variant="warning" description="Aguardando pagamento" />
        <StatsCard title="Saldo Líquido" value={`R$ ${(totalReceber - totalPagar).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={QrCode} variant="info" description="Receber - Pagar" />
      </div>

      <Tabs defaultValue="receber" className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="receber" className="gap-2"><ArrowUpCircle className="h-4 w-4" />A Receber</TabsTrigger>
          <TabsTrigger value="pagar" className="gap-2"><ArrowDownCircle className="h-4 w-4" />A Pagar</TabsTrigger>
          <TabsTrigger value="cobranca" className="gap-2"><CreditCard className="h-4 w-4" />Cobrança</TabsTrigger>
        </TabsList>

        <TabsContent value="receber" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>Contas a Receber</CardTitle><CardDescription>Títulos pendentes de recebimento</CardDescription></div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingReceber ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={DollarSign} title="Acesse pelo Bitrix24" />
              ) : receberList.length === 0 ? (
                <EmptyState icon={DollarSign} title="Nenhum título a receber" description="Títulos do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Documento</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receberList.map((t: any, idx: number) => {
                      const status = t.status_titulo || t.cStatus || "ABERTO";
                      return (
                        <TableRow key={t.codigo_lancamento_omie || idx}>
                          <TableCell className="font-medium">{t.numero_documento || t.cNumDocFiscal || "-"}</TableCell>
                          <TableCell>{t.codigo_cliente_fornecedor || t.nCodCliente || "-"}</TableCell>
                          <TableCell>{t.data_vencimento || t.dDtVenc || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={status === "LIQUIDADO" ? "default" : status === "ATRASADO" ? "destructive" : "secondary"}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(t.valor_documento || t.nValorTitulo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" title="Gerar Boleto" onClick={() => gerarBoletoMutation.mutate(t.codigo_lancamento_omie || t.nCodTitulo)} disabled={gerarBoletoMutation.isPending}>
                                <CreditCard className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Gerar PIX" onClick={() => gerarPixMutation.mutate(t.codigo_lancamento_omie || t.nCodTitulo)} disabled={gerarPixMutation.isPending}>
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pagar" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Contas a Pagar</CardTitle><CardDescription>Títulos pendentes de pagamento</CardDescription></CardHeader>
            <CardContent>
              {loadingPagar ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={ArrowDownCircle} title="Acesse pelo Bitrix24" />
              ) : pagarList.length === 0 ? (
                <EmptyState icon={ArrowDownCircle} title="Nenhum título a pagar" description="Títulos do Omie aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Documento</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagarList.map((t: any, idx: number) => {
                      const status = t.status_titulo || t.cStatus || "ABERTO";
                      return (
                        <TableRow key={t.codigo_lancamento_omie || idx}>
                          <TableCell className="font-medium">{t.numero_documento || t.cNumDocFiscal || "-"}</TableCell>
                          <TableCell>{t.codigo_cliente_fornecedor || t.nCodCliente || "-"}</TableCell>
                          <TableCell>{t.data_vencimento || t.dDtVenc || "-"}</TableCell>
                          <TableCell><Badge variant={status === "LIQUIDADO" ? "default" : status === "ATRASADO" ? "destructive" : "secondary"}>{status}</Badge></TableCell>
                          <TableCell className="text-right font-medium">R$ {Number(t.valor_documento || t.nValorTitulo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cobranca" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Cobrança Rápida</CardTitle>
              <CardDescription>Selecione um título na aba "A Receber" para gerar boleto ou PIX</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar Boleto</h3>
                  <p className="text-sm text-muted-foreground mb-4">Clique no ícone 💳 em um título para gerar boleto</p>
                </div>
                <div className="p-6 rounded-xl border border-dashed border-border text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Gerar PIX</h3>
                  <p className="text-sm text-muted-foreground mb-4">Clique no ícone QR em um título para gerar PIX</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PIX Dialog */}
      <Dialog open={pixDialog.open} onOpenChange={(open) => !open && setPixDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code PIX</DialogTitle>
            <DialogDescription>Use o QR Code ou copie o código para pagar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {pixDialog.qrCode && (
              <img src={pixDialog.qrCode} alt="QR Code PIX" className="mx-auto w-48 h-48 border rounded-lg" />
            )}
            {pixDialog.copiaCola && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Copia e Cola:</p>
                <div className="flex gap-2">
                  <Input value={pixDialog.copiaCola} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(pixDialog.copiaCola || ""); toast.success("Código copiado!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <h3 className="font-medium text-muted-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>}
    </div>
  );
}

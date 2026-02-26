import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calculator,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Package,
  FolderDown,
  BarChart3,
  Loader2,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

export default function Contador() {
  const { memberId } = useTenant();
  const now = new Date();
  const [mesReferencia, setMesReferencia] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const { data: resumo, isLoading: loadingResumo, refetch, isFetching } = useQuery({
    queryKey: ["contador-resumo", memberId, mesReferencia],
    queryFn: async () => {
      if (!memberId) return null;
      const [ano, mes] = mesReferencia.split("-");
      const { data, error } = await supabase.functions.invoke("omie-contador", {
        body: { tenant_id: memberId, action: "resumo_fiscal_mensal", data: { mes: Number(mes), ano: Number(ano) } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: xmlsNfe, isLoading: loadingNfe } = useQuery({
    queryKey: ["contador-nfe", memberId, mesReferencia],
    queryFn: async () => {
      if (!memberId) return null;
      const [ano, mes] = mesReferencia.split("-");
      const { data, error } = await supabase.functions.invoke("omie-contador", {
        body: { tenant_id: memberId, action: "listar_xmls_nfe", data: { mes: Number(mes), ano: Number(ano), pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const { data: xmlsNfse, isLoading: loadingNfse } = useQuery({
    queryKey: ["contador-nfse", memberId, mesReferencia],
    queryFn: async () => {
      if (!memberId) return null;
      const [ano, mes] = mesReferencia.split("-");
      const { data, error } = await supabase.functions.invoke("omie-contador", {
        body: { tenant_id: memberId, action: "listar_xmls_nfse", data: { mes: Number(mes), ano: Number(ano), pagina: 1, registros_por_pagina: 50 } },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!memberId,
  });

  const nfeList = xmlsNfe?.data?.nfCadastro || xmlsNfe?.data?.notas || [];
  const nfseList = xmlsNfse?.data?.nfseCadastro || xmlsNfse?.data?.notas || [];
  const resumoData = resumo?.data || {};

  const totalNfe = resumoData.total_nfe || nfeList.length;
  const totalNfse = resumoData.total_nfse || nfseList.length;
  const valorNfe = resumoData.valor_nfe || nfeList.reduce((a: number, n: any) => a + Number(n.nValorNF || n.valor_total || 0), 0);
  const valorNfse = resumoData.valor_nfse || nfseList.reduce((a: number, n: any) => a + Number(n.nValorNF || n.valor_total || 0), 0);

  const handleExportLote = async (tipo: string) => {
    if (!memberId) return;
    const [ano, mes] = mesReferencia.split("-");
    toast.info(`Exportando XMLs ${tipo}...`);
    try {
      const { data, error } = await supabase.functions.invoke("omie-contador", {
        body: { tenant_id: memberId, action: "exportar_xmls_periodo", data: { tipo, mes: Number(mes), ano: Number(ano) } },
      });
      if (error) throw error;
      toast.success(`Exportação ${tipo} concluída! ${data?.data?.total || 0} XMLs processados.`);
    } catch (e: any) {
      toast.error(`Erro na exportação: ${e.message}`);
    }
  };

  const monthOptions = getMonthOptions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10"><Calculator className="h-8 w-8 text-primary" /></div>
            Contador
          </h1>
          <p className="mt-1 text-muted-foreground">Exportação de XMLs fiscais e resumos contábeis</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Atualizar
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <Calendar className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-4">
            <Label>Período de Referência:</Label>
            <Select value={mesReferencia} onValueChange={setMesReferencia}>
              <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="NF-e Emitidas" value={String(totalNfe)} icon={FileText} variant="info" description="No período" />
        <StatsCard title="NFS-e Emitidas" value={String(totalNfse)} icon={FileText} variant="success" description="No período" />
        <StatsCard title="Valor NF-e" value={`R$ ${Number(valorNfe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={BarChart3} variant="default" description="Faturamento produtos" />
        <StatsCard title="Valor NFS-e" value={`R$ ${Number(valorNfse).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} icon={BarChart3} variant="default" description="Faturamento serviços" />
      </div>

      <Tabs defaultValue="nfe" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="nfe" className="gap-2"><Package className="h-4 w-4" />NF-e</TabsTrigger>
          <TabsTrigger value="nfse" className="gap-2"><FileText className="h-4 w-4" />NFS-e</TabsTrigger>
          <TabsTrigger value="resumo" className="gap-2"><BarChart3 className="h-4 w-4" />Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="nfe" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>XMLs de NF-e</CardTitle><CardDescription>Notas fiscais eletrônicas de produtos</CardDescription></div>
                <Button className="gap-2" onClick={() => handleExportLote("nfe")}><Download className="h-4 w-4" />Download Lote</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNfe ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !memberId ? (
                <EmptyState icon={Package} title="Acesse pelo Bitrix24" />
              ) : nfeList.length === 0 ? (
                <EmptyState icon={Package} title="Nenhuma NF-e encontrada" description="NF-e do período selecionado aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº NF-e</TableHead>
                      <TableHead>Série</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfeList.map((nf: any, idx: number) => (
                      <TableRow key={nf.nNF || idx}>
                        <TableCell className="font-medium">{nf.nNF || nf.numero_nf || "-"}</TableCell>
                        <TableCell>{nf.cSerie || nf.serie || "-"}</TableCell>
                        <TableCell>{nf.dDtEmissao || nf.data_emissao || "-"}</TableCell>
                        <TableCell>{nf.cRazaoSocial || nf.destinatario || "-"}</TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(nf.nValorNF || nf.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfse" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle>XMLs de NFS-e</CardTitle><CardDescription>Notas fiscais de serviço</CardDescription></div>
                <Button className="gap-2" onClick={() => handleExportLote("nfse")}><Download className="h-4 w-4" />Download Lote</Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingNfse ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : nfseList.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhuma NFS-e encontrada" description="NFS-e do período aparecerão aqui" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº NFS-e</TableHead>
                      <TableHead>Data Emissão</TableHead>
                      <TableHead>Tomador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfseList.map((nf: any, idx: number) => (
                      <TableRow key={nf.nNFSe || nf.nNF || idx}>
                        <TableCell className="font-medium">{nf.nNFSe || nf.nNF || "-"}</TableCell>
                        <TableCell>{nf.dDtEmissao || "-"}</TableCell>
                        <TableCell>{nf.cRazaoSocial || nf.tomador || "-"}</TableCell>
                        <TableCell className="text-right font-medium">R$ {Number(nf.nValorNF || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          {loadingResumo ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Resumo Fiscal — Produtos</CardTitle><CardDescription>NF-e do período selecionado</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <SummaryRow label="Total de Notas" value={String(totalNfe)} />
                    <SummaryRow label="Valor Total" value={`R$ ${Number(valorNfe).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <SummaryRow label="ICMS Total" value={`R$ ${Number(resumoData.icms_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <SummaryRow label="PIS/COFINS" value={`R$ ${Number(resumoData.pis_cofins_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Resumo Fiscal — Serviços</CardTitle><CardDescription>NFS-e do período selecionado</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <SummaryRow label="Total de Notas" value={String(totalNfse)} />
                    <SummaryRow label="Valor Total" value={`R$ ${Number(valorNfse).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <SummaryRow label="ISS Retido" value={`R$ ${Number(resumoData.iss_retido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <SummaryRow label="IR Retido" value={`R$ ${Number(resumoData.ir_retido || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Exportação em Lote</CardTitle><CardDescription>Baixe todos os XMLs para enviar ao contador</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleExportLote("nfe")}>
                      <Package className="h-8 w-8" /><span>XMLs NF-e</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => handleExportLote("nfse")}>
                      <FileText className="h-8 w-8" /><span>XMLs NFS-e</span>
                    </Button>
                    <Button className="h-24 flex-col gap-2" onClick={() => handleExportLote("todos")}>
                      <FolderDown className="h-8 w-8" /><span>Pacote Completo</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between p-3 rounded-lg bg-muted/50">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
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

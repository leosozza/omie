import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calculator,
  FileText,
  Download,
  RefreshCw,
  Calendar,
  Package,
  CheckCircle2,
  FolderDown,
  BarChart3,
} from "lucide-react";
import { StatsCard } from "@/components/ui/stats-card";

export default function Contador() {
  const [mesReferencia, setMesReferencia] = useState("2024-01");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-module-contador/20">
              <Calculator className="h-8 w-8 text-module-contador" />
            </div>
            <span className="text-gradient-omie">Contador</span>
          </h1>
          <p className="mt-1 text-muted-foreground">
            Exportação de XMLs fiscais e resumos contábeis para escritório de contabilidade
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Button className="gap-2 gradient-primary shadow-glow">
            <FolderDown className="h-4 w-4" />
            Exportar Tudo
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <Calendar className="h-5 w-5 text-primary" />
          <div className="flex items-center gap-4">
            <Label>Período de Referência:</Label>
            <Select value={mesReferencia} onValueChange={setMesReferencia}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">Janeiro 2024</SelectItem>
                <SelectItem value="2023-12">Dezembro 2023</SelectItem>
                <SelectItem value="2023-11">Novembro 2023</SelectItem>
                <SelectItem value="2023-10">Outubro 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="NF-e Emitidas"
          value="156"
          icon={FileText}
          variant="info"
          description="No período"
        />
        <StatsCard
          title="NFS-e Emitidas"
          value="89"
          icon={FileText}
          variant="success"
          description="No período"
        />
        <StatsCard
          title="Valor Total NF-e"
          value="R$ 1.2M"
          icon={BarChart3}
          variant="default"
          description="Faturamento produtos"
        />
        <StatsCard
          title="Valor Total NFS-e"
          value="R$ 456K"
          icon={BarChart3}
          variant="default"
          description="Faturamento serviços"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nfe" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="nfe" className="gap-2">
            <Package className="h-4 w-4" />
            NF-e
          </TabsTrigger>
          <TabsTrigger value="nfse" className="gap-2">
            <FileText className="h-4 w-4" />
            NFS-e
          </TabsTrigger>
          <TabsTrigger value="resumo" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nfe" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>XMLs de NF-e</CardTitle>
                  <CardDescription>Notas fiscais eletrônicas de produtos</CardDescription>
                </div>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Lote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma NF-e encontrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para exportar os XMLs
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nfse" className="space-y-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>XMLs de NFS-e</CardTitle>
                  <CardDescription>Notas fiscais de serviço eletrônicas</CardDescription>
                </div>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Download Lote
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground">Nenhuma NFS-e encontrada</h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Configure a integração com o Omie para exportar os XMLs
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Resumo Fiscal - Produtos</CardTitle>
                <CardDescription>NF-e do período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Total de Notas</span>
                  <span className="font-semibold">156</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-semibold">R$ 1.245.800,00</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ICMS Total</span>
                  <span className="font-semibold">R$ 224.244,00</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">PIS/COFINS</span>
                  <span className="font-semibold">R$ 115.040,00</span>
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Resumo Fiscal - Serviços</CardTitle>
                <CardDescription>NFS-e do período selecionado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Total de Notas</span>
                  <span className="font-semibold">89</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-semibold">R$ 456.200,00</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">ISS Retido</span>
                  <span className="font-semibold">R$ 22.810,00</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">IR Retido</span>
                  <span className="font-semibold">R$ 6.843,00</span>
                </div>
                <Button className="w-full gap-2">
                  <Download className="h-4 w-4" />
                  Exportar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Exportação em Lote</CardTitle>
              <CardDescription>Baixe todos os XMLs do período para enviar ao contador</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <Package className="h-8 w-8" />
                  <span>XMLs NF-e (156 arquivos)</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col gap-2">
                  <FileText className="h-8 w-8" />
                  <span>XMLs NFS-e (89 arquivos)</span>
                </Button>
                <Button className="h-24 flex-col gap-2 gradient-primary">
                  <FolderDown className="h-8 w-8" />
                  <span>Pacote Completo (.zip)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

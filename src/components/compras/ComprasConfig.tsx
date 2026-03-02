import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, RefreshCw, Plus, Trash2, Settings, Building2, FolderTree, Wallet } from "lucide-react";

interface ComprasConfigProps {
  memberId: string | null;
}

export function ComprasConfig({ memberId }: ComprasConfigProps) {
  const queryClient = useQueryClient();
  const [rateioLines, setRateioLines] = useState<{ departamento: string; nome: string; percentual: number }[]>([]);

  // Fetch existing config
  const { data: configs, isLoading: loadingConfigs } = useQuery({
    queryKey: ["purchase-config", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_purchase_config" },
      });
      if (error) throw error;
      return data?.data || [];
    },
    enabled: !!memberId,
  });

  // Fetch contas correntes from Omie
  const { data: contasCorrentes, isLoading: loadingCC, refetch: refetchCC } = useQuery({
    queryKey: ["omie-contas-correntes", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_contas_correntes" },
      });
      if (error) throw error;
      return data?.data?.conta_corrente_cadastro || data?.data?.ListarContasCorrentes || [];
    },
    enabled: !!memberId,
  });

  // Fetch centros de custo from Omie
  const { data: centrosCusto, isLoading: loadingDept, refetch: refetchDept } = useQuery({
    queryKey: ["omie-centros-custo", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_centros_custo" },
      });
      if (error) throw error;
      return data?.data?.departamentos || data?.data?.cadastros || [];
    },
    enabled: !!memberId,
  });

  // Fetch categorias from Omie
  const { data: categorias, isLoading: loadingCat, refetch: refetchCat } = useQuery({
    queryKey: ["omie-categorias", memberId],
    queryFn: async () => {
      if (!memberId) return [];
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: { tenant_id: memberId, action: "listar_categorias" },
      });
      if (error) throw error;
      return data?.data?.categoria_cadastro || data?.data?.categorias || [];
    },
    enabled: !!memberId,
  });

  // Save config mutation
  const saveMutation = useMutation({
    mutationFn: async (configData: { config_type: string; omie_code: string; omie_name: string; is_default: boolean; percentual?: number }) => {
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: {
          tenant_id: memberId,
          action: "salvar_purchase_config",
          data: configData,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-config"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: (err: any) => {
      toast.error("Erro ao salvar: " + (err.message || "Erro desconhecido"));
    },
  });

  const totalRateio = rateioLines.reduce((acc, l) => acc + (l.percentual || 0), 0);

  const addRateioLine = () => {
    setRateioLines([...rateioLines, { departamento: "", nome: "", percentual: 0 }]);
  };

  const removeRateioLine = (idx: number) => {
    setRateioLines(rateioLines.filter((_, i) => i !== idx));
  };

  const saveRateio = () => {
    if (Math.abs(totalRateio - 100) > 0.01) {
      toast.error("O total do rateio deve ser exatamente 100%");
      return;
    }
    rateioLines.forEach((line) => {
      saveMutation.mutate({
        config_type: "rateio",
        omie_code: line.departamento,
        omie_name: line.nome,
        is_default: false,
        percentual: line.percentual,
      });
    });
  };

  if (!memberId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Settings className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Acesse pelo Bitrix24 para configurar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conta Corrente Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Conta Corrente Padrão</CardTitle>
          <CardDescription>Selecione a conta corrente padrão para lançamentos de compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Conta Corrente</Label>
              {loadingCC ? (
                <div className="flex items-center gap-2 mt-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Carregando...</span></div>
              ) : (
                <Select onValueChange={(val) => {
                  const cc = (contasCorrentes || []).find((c: any) => String(c.nCodCC) === val);
                  if (cc) saveMutation.mutate({ config_type: "conta_corrente", omie_code: val, omie_name: cc.cDescricao || cc.descricao || val, is_default: true });
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(contasCorrentes || []).map((cc: any) => (
                      <SelectItem key={cc.nCodCC} value={String(cc.nCodCC)}>{cc.cDescricao || cc.descricao || cc.nCodCC}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchCC()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Categoria Padrão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderTree className="h-5 w-5" />Categoria Padrão</CardTitle>
          <CardDescription>Categoria padrão para lançamentos financeiros de compras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Categoria</Label>
              {loadingCat ? (
                <div className="flex items-center gap-2 mt-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Carregando...</span></div>
              ) : (
                <Select onValueChange={(val) => {
                  const cat = (categorias || []).find((c: any) => c.cCodigo === val);
                  if (cat) saveMutation.mutate({ config_type: "categoria", omie_code: val, omie_name: cat.cDescricao || val, is_default: true });
                }}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(categorias || []).map((cat: any) => (
                      <SelectItem key={cat.cCodigo} value={cat.cCodigo}>{cat.cCodigo} - {cat.cDescricao || "-"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button variant="outline" size="icon" onClick={() => refetchCat()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Rateio por Centro de Custo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Rateio por Centro de Custo</CardTitle>
          <CardDescription>Configure a distribuição percentual entre departamentos. O total deve ser 100%.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" className="gap-2" onClick={addRateioLine}><Plus className="h-4 w-4" />Adicionar Linha</Button>
            <Button variant="outline" size="sm" onClick={() => refetchDept()}><RefreshCw className="h-4 w-4 mr-2" />Atualizar Departamentos</Button>
          </div>

          {rateioLines.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead className="w-32">Percentual (%)</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rateioLines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        {loadingDept ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={line.departamento}
                            onValueChange={(val) => {
                              const dept = (centrosCusto || []).find((d: any) => String(d.codigo || d.nCodDepto) === val);
                              const updated = [...rateioLines];
                              updated[idx] = { ...updated[idx], departamento: val, nome: dept?.descricao || dept?.cDescricao || val };
                              setRateioLines(updated);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
                            <SelectContent>
                              {(centrosCusto || []).map((d: any) => (
                                <SelectItem key={d.codigo || d.nCodDepto} value={String(d.codigo || d.nCodDepto)}>
                                  {d.descricao || d.cDescricao || d.codigo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={line.percentual}
                          onChange={(e) => {
                            const updated = [...rateioLines];
                            updated[idx] = { ...updated[idx], percentual: Number(e.target.value) };
                            setRateioLines(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeRateioLine(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Total:</span>
                  <Badge variant={Math.abs(totalRateio - 100) < 0.01 ? "default" : "destructive"}>
                    {totalRateio.toFixed(2)}%
                  </Badge>
                </div>
                <Button onClick={saveRateio} disabled={saveMutation.isPending || Math.abs(totalRateio - 100) > 0.01}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Rateio
                </Button>
              </div>
            </>
          )}

          {rateioLines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma regra de rateio configurada. Clique em "Adicionar Linha" para começar.</p>
          )}
        </CardContent>
      </Card>

      {/* Configurações Salvas */}
      {configs && configs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações Salvas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Código Omie</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Padrão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell><Badge variant="outline">{c.config_type}</Badge></TableCell>
                    <TableCell className="font-mono text-sm">{c.omie_code}</TableCell>
                    <TableCell>{c.omie_name}</TableCell>
                    <TableCell>{c.percentual ? `${c.percentual}%` : "-"}</TableCell>
                    <TableCell>{c.is_default ? <Badge>Padrão</Badge> : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

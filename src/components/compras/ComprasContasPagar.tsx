import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, CreditCard } from "lucide-react";

interface ComprasContasPagarProps {
  memberId: string | null;
}

export function ComprasContasPagar({ memberId }: ComprasContasPagarProps) {
  const [form, setForm] = useState({
    codigo_cliente_fornecedor: "",
    data_vencimento: "",
    valor_documento: "",
    observacao: "",
    chave_danfe: "",
  });

  // Load saved configs for defaults
  const { data: configs } = useQuery({
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

  const defaultCC = (configs || []).find((c: any) => c.config_type === "conta_corrente" && c.is_default);
  const defaultCat = (configs || []).find((c: any) => c.config_type === "categoria" && c.is_default);
  const rateioRules = (configs || []).filter((c: any) => c.config_type === "rateio" && c.is_active);

  // Lançar conta a pagar
  const contaPagarMutation = useMutation({
    mutationFn: async () => {
      const distribuicao = rateioRules.map((r: any) => ({
        codigo_departamento: r.omie_code,
        percentual: r.percentual,
        valor_fixo: (Number(form.valor_documento) * (r.percentual / 100)).toFixed(2),
      }));

      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: {
          tenant_id: memberId,
          action: "incluir_conta_pagar_avancado",
          data: {
            codigo_lancamento_integracao: `BITRIX_${Date.now()}`,
            codigo_cliente_fornecedor: Number(form.codigo_cliente_fornecedor),
            data_vencimento: form.data_vencimento,
            valor_documento: Number(form.valor_documento),
            codigo_categoria: defaultCat?.omie_code || "",
            id_conta_corrente: defaultCC ? Number(defaultCC.omie_code) : 0,
            observacao: form.observacao,
            distribuicao: distribuicao.length > 0 ? distribuicao : undefined,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Conta a pagar lançada com sucesso!");
      setForm({ codigo_cliente_fornecedor: "", data_vencimento: "", valor_documento: "", observacao: "", chave_danfe: "" });
    },
    onError: (err: any) => {
      toast.error("Erro: " + (err.message || "Erro desconhecido"));
    },
  });

  // Importar DANFE
  const danfeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("omie-compras", {
        body: {
          tenant_id: memberId,
          action: "importar_nfe_danfe",
          data: { chave_acesso: form.chave_danfe },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("NF-e importada via DANFE com sucesso!");
      setForm({ ...form, chave_danfe: "" });
    },
    onError: (err: any) => {
      toast.error("Erro ao importar DANFE: " + (err.message || "Erro desconhecido"));
    },
  });

  if (!memberId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Acesse pelo Bitrix24 para usar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lançar Conta a Pagar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Lançar Conta a Pagar</CardTitle>
          <CardDescription>
            Lançamento com rateio por centro de custo e conta corrente configurados.
            {defaultCC && <span className="block mt-1 text-xs">CC Padrão: {defaultCC.omie_name}</span>}
            {defaultCat && <span className="block text-xs">Categoria Padrão: {defaultCat.omie_name}</span>}
            {rateioRules.length > 0 && <span className="block text-xs">Rateio: {rateioRules.map((r: any) => `${r.omie_name} ${r.percentual}%`).join(", ")}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Código do Fornecedor (Omie)</Label>
              <Input type="number" placeholder="Ex: 123456789" value={form.codigo_cliente_fornecedor} onChange={(e) => setForm({ ...form, codigo_cliente_fornecedor: e.target.value })} />
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={form.valor_documento} onChange={(e) => setForm({ ...form, valor_documento: e.target.value })} />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea placeholder="Descrição do lançamento..." value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
            </div>
          </div>
          <Button className="mt-4 gap-2" onClick={() => contaPagarMutation.mutate()} disabled={contaPagarMutation.isPending || !form.codigo_cliente_fornecedor || !form.valor_documento}>
            {contaPagarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Lançar no Omie
          </Button>
        </CardContent>
      </Card>

      {/* Importar DANFE */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Importar NF-e via DANFE</CardTitle>
          <CardDescription>Cole a chave de acesso de 44 dígitos para importar a nota fiscal de entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Chave de Acesso DANFE</Label>
            <Input placeholder="44 dígitos da chave de acesso" maxLength={44} value={form.chave_danfe} onChange={(e) => setForm({ ...form, chave_danfe: e.target.value.replace(/\D/g, "") })} className="font-mono" />
          </div>
          <Button className="mt-4 gap-2" onClick={() => danfeMutation.mutate()} disabled={danfeMutation.isPending || form.chave_danfe.length !== 44}>
            {danfeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Importar NF-e
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

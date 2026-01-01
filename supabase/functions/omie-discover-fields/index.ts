import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OmieField {
  field_code: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  options?: Record<string, string>;
}

// Omie field definitions for each entity type
const OMIE_ENTITY_FIELDS: Record<string, OmieField[]> = {
  cliente: [
    { field_code: "codigo_cliente_integracao", field_name: "Código Integração", field_type: "string", is_required: true },
    { field_code: "razao_social", field_name: "Razão Social", field_type: "string", is_required: true },
    { field_code: "nome_fantasia", field_name: "Nome Fantasia", field_type: "string", is_required: false },
    { field_code: "cnpj_cpf", field_name: "CNPJ/CPF", field_type: "string", is_required: true },
    { field_code: "inscricao_estadual", field_name: "Inscrição Estadual", field_type: "string", is_required: false },
    { field_code: "inscricao_municipal", field_name: "Inscrição Municipal", field_type: "string", is_required: false },
    { field_code: "email", field_name: "E-mail", field_type: "string", is_required: false },
    { field_code: "telefone1_ddd", field_name: "Telefone DDD", field_type: "string", is_required: false },
    { field_code: "telefone1_numero", field_name: "Telefone Número", field_type: "string", is_required: false },
    { field_code: "contato", field_name: "Contato", field_type: "string", is_required: false },
    { field_code: "endereco", field_name: "Endereço", field_type: "string", is_required: false },
    { field_code: "endereco_numero", field_name: "Número", field_type: "string", is_required: false },
    { field_code: "complemento", field_name: "Complemento", field_type: "string", is_required: false },
    { field_code: "bairro", field_name: "Bairro", field_type: "string", is_required: false },
    { field_code: "cidade", field_name: "Cidade", field_type: "string", is_required: false },
    { field_code: "estado", field_name: "Estado (UF)", field_type: "string", is_required: false },
    { field_code: "cep", field_name: "CEP", field_type: "string", is_required: false },
    { field_code: "codigo_pais", field_name: "Código País", field_type: "string", is_required: false },
    { field_code: "pessoa_fisica", field_name: "Pessoa Física", field_type: "string", is_required: false },
    { field_code: "optante_simples_nacional", field_name: "Optante Simples Nacional", field_type: "string", is_required: false },
    { field_code: "contribuinte", field_name: "Contribuinte ICMS", field_type: "string", is_required: false },
    { field_code: "observacao", field_name: "Observação", field_type: "string", is_required: false },
    { field_code: "inativo", field_name: "Inativo", field_type: "string", is_required: false },
    { field_code: "tags", field_name: "Tags", field_type: "array", is_required: false },
  ],
  pedido: [
    { field_code: "codigo_pedido_integracao", field_name: "Código Integração Pedido", field_type: "string", is_required: true },
    { field_code: "codigo_cliente", field_name: "Código Cliente Omie", field_type: "number", is_required: true },
    { field_code: "codigo_cliente_integracao", field_name: "Código Integração Cliente", field_type: "string", is_required: false },
    { field_code: "data_previsao", field_name: "Data Previsão", field_type: "date", is_required: false },
    { field_code: "etapa", field_name: "Etapa do Pedido", field_type: "string", is_required: false },
    { field_code: "codigo_parcela", field_name: "Código Parcela", field_type: "string", is_required: false },
    { field_code: "quantidade_itens", field_name: "Quantidade de Itens", field_type: "number", is_required: false },
    { field_code: "observacoes_pedido", field_name: "Observações", field_type: "string", is_required: false },
    { field_code: "codigo_categoria", field_name: "Código Categoria", field_type: "string", is_required: false },
    { field_code: "codigo_conta_corrente", field_name: "Código Conta Corrente", field_type: "number", is_required: false },
    { field_code: "consumidor_final", field_name: "Consumidor Final", field_type: "string", is_required: false },
    { field_code: "enviar_email", field_name: "Enviar E-mail", field_type: "string", is_required: false },
  ],
  ordem_servico: [
    { field_code: "cCodIntOS", field_name: "Código Integração OS", field_type: "string", is_required: true },
    { field_code: "nCodCli", field_name: "Código Cliente Omie", field_type: "number", is_required: true },
    { field_code: "cCodIntCli", field_name: "Código Integração Cliente", field_type: "string", is_required: false },
    { field_code: "cEtapa", field_name: "Etapa da OS", field_type: "string", is_required: false },
    { field_code: "dDtPrevisao", field_name: "Data Previsão", field_type: "date", is_required: false },
    { field_code: "cObsOS", field_name: "Observações", field_type: "string", is_required: false },
    { field_code: "nQtdeParc", field_name: "Quantidade Parcelas", field_type: "number", is_required: false },
    { field_code: "cCodParc", field_name: "Código Parcela", field_type: "string", is_required: false },
    { field_code: "nCodCC", field_name: "Código Conta Corrente", field_type: "number", is_required: false },
    { field_code: "cCodCateg", field_name: "Código Categoria", field_type: "string", is_required: false },
  ],
  produto: [
    { field_code: "codigo_produto_integracao", field_name: "Código Integração", field_type: "string", is_required: true },
    { field_code: "codigo", field_name: "Código do Produto", field_type: "string", is_required: true },
    { field_code: "descricao", field_name: "Descrição", field_type: "string", is_required: true },
    { field_code: "unidade", field_name: "Unidade", field_type: "string", is_required: true },
    { field_code: "ncm", field_name: "NCM", field_type: "string", is_required: false },
    { field_code: "ean", field_name: "EAN/GTIN", field_type: "string", is_required: false },
    { field_code: "valor_unitario", field_name: "Valor Unitário", field_type: "number", is_required: false },
    { field_code: "peso_liq", field_name: "Peso Líquido", field_type: "number", is_required: false },
    { field_code: "peso_bruto", field_name: "Peso Bruto", field_type: "number", is_required: false },
    { field_code: "altura", field_name: "Altura", field_type: "number", is_required: false },
    { field_code: "largura", field_name: "Largura", field_type: "number", is_required: false },
    { field_code: "profundidade", field_name: "Profundidade", field_type: "number", is_required: false },
    { field_code: "estoque", field_name: "Estoque", field_type: "number", is_required: false },
    { field_code: "familia", field_name: "Família", field_type: "string", is_required: false },
    { field_code: "marca", field_name: "Marca", field_type: "string", is_required: false },
    { field_code: "modelo", field_name: "Modelo", field_type: "string", is_required: false },
    { field_code: "inativo", field_name: "Inativo", field_type: "string", is_required: false },
    { field_code: "observacoes", field_name: "Observações", field_type: "string", is_required: false },
  ],
  servico: [
    { field_code: "cCodIntServ", field_name: "Código Integração", field_type: "string", is_required: true },
    { field_code: "cCodigo", field_name: "Código do Serviço", field_type: "string", is_required: true },
    { field_code: "cDescricao", field_name: "Descrição", field_type: "string", is_required: true },
    { field_code: "nPrecoUnit", field_name: "Preço Unitário", field_type: "number", is_required: false },
    { field_code: "cCodCateg", field_name: "Código Categoria", field_type: "string", is_required: false },
    { field_code: "cCodLC116", field_name: "Código LC 116", field_type: "string", is_required: false },
    { field_code: "cDescServ", field_name: "Descrição Serviço NFS-e", field_type: "string", is_required: false },
    { field_code: "nAliqISS", field_name: "Alíquota ISS", field_type: "number", is_required: false },
    { field_code: "cRetISS", field_name: "Retém ISS", field_type: "string", is_required: false },
    { field_code: "cInativo", field_name: "Inativo", field_type: "string", is_required: false },
  ],
  nfe: [
    { field_code: "nNF", field_name: "Número da NF-e", field_type: "number", is_required: false },
    { field_code: "cSerie", field_name: "Série", field_type: "string", is_required: false },
    { field_code: "dEmi", field_name: "Data de Emissão", field_type: "date", is_required: false },
    { field_code: "cChaveNFe", field_name: "Chave NF-e", field_type: "string", is_required: false },
    { field_code: "cStatus", field_name: "Status", field_type: "string", is_required: false },
    { field_code: "nCodPed", field_name: "Código Pedido", field_type: "number", is_required: false },
    { field_code: "nCodOS", field_name: "Código OS", field_type: "number", is_required: false },
    { field_code: "nValorTotal", field_name: "Valor Total", field_type: "number", is_required: false },
    { field_code: "cUrlDanfe", field_name: "URL DANFE (PDF)", field_type: "string", is_required: false },
    { field_code: "cUrlXml", field_name: "URL XML", field_type: "string", is_required: false },
  ],
  nfse: [
    { field_code: "nNFS", field_name: "Número da NFS-e", field_type: "number", is_required: false },
    { field_code: "cSerie", field_name: "Série", field_type: "string", is_required: false },
    { field_code: "dEmi", field_name: "Data de Emissão", field_type: "date", is_required: false },
    { field_code: "cStatus", field_name: "Status", field_type: "string", is_required: false },
    { field_code: "nCodOS", field_name: "Código OS", field_type: "number", is_required: false },
    { field_code: "nValorTotal", field_name: "Valor Total", field_type: "number", is_required: false },
    { field_code: "cUrlPdf", field_name: "URL PDF", field_type: "string", is_required: false },
    { field_code: "cUrlXml", field_name: "URL XML", field_type: "string", is_required: false },
    { field_code: "cCodigoVerificacao", field_name: "Código Verificação", field_type: "string", is_required: false },
  ],
  conta_receber: [
    { field_code: "codigo_lancamento_integracao", field_name: "Código Integração", field_type: "string", is_required: true },
    { field_code: "codigo_cliente_fornecedor", field_name: "Código Cliente", field_type: "number", is_required: true },
    { field_code: "data_vencimento", field_name: "Data Vencimento", field_type: "date", is_required: true },
    { field_code: "valor_documento", field_name: "Valor Documento", field_type: "number", is_required: true },
    { field_code: "codigo_categoria", field_name: "Código Categoria", field_type: "string", is_required: false },
    { field_code: "data_previsao", field_name: "Data Previsão", field_type: "date", is_required: false },
    { field_code: "id_conta_corrente", field_name: "ID Conta Corrente", field_type: "number", is_required: false },
    { field_code: "numero_documento", field_name: "Número Documento", field_type: "string", is_required: false },
    { field_code: "numero_parcela", field_name: "Número Parcela", field_type: "string", is_required: false },
    { field_code: "observacao", field_name: "Observação", field_type: "string", is_required: false },
    { field_code: "status_titulo", field_name: "Status", field_type: "string", is_required: false },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { memberId, entityType } = await req.json();

    if (!memberId || !entityType) {
      return new Response(
        JSON.stringify({ error: "memberId and entityType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[omie-discover-fields] Discovering fields for ${entityType} in tenant ${memberId}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Omie configuration to validate tenant exists
    const { data: config, error: configError } = await supabase
      .from("omie_configurations")
      .select("*")
      .eq("tenant_id", memberId)
      .eq("is_active", true)
      .single();

    // For demo mode or when no config, still return fields
    const fields = OMIE_ENTITY_FIELDS[entityType];

    if (!fields) {
      return new Response(
        JSON.stringify({ error: `Unknown entity type: ${entityType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[omie-discover-fields] Returning ${fields.length} fields for ${entityType}`);

    // Cache fields in database
    const cacheRecords = fields.map((f) => ({
      tenant_id: memberId,
      entity_type: entityType,
      field_code: f.field_code,
      field_name: f.field_name,
      field_type: f.field_type,
      is_required: f.is_required,
      options: f.options ? JSON.stringify(f.options) : null,
      cached_at: new Date().toISOString(),
    }));

    // Delete old cached fields for this entity
    await supabase
      .from("omie_cached_fields")
      .delete()
      .eq("tenant_id", memberId)
      .eq("entity_type", entityType);

    // Insert new cached fields
    if (cacheRecords.length > 0) {
      const { error: cacheError } = await supabase
        .from("omie_cached_fields")
        .insert(cacheRecords);

      if (cacheError) {
        console.error("[omie-discover-fields] Cache error:", cacheError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        fields,
        count: fields.length,
        cached_at: new Date().toISOString(),
        has_config: !!config,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[omie-discover-fields] Error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

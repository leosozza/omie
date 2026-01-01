import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OMIE_API_URL = "https://app.omie.com.br/api/v1";

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(endpoint: string, call: string, params: Record<string, unknown>, credentials: OmieCredentials) {
  const response = await fetch(`${OMIE_API_URL}/${endpoint}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      call,
      app_key: credentials.app_key,
      app_secret: credentials.app_secret,
      param: [params],
    }),
  });

  if (!response.ok) {
    throw new Error(`Omie API error: ${response.status}`);
  }

  return response.json();
}

async function getOmieCredentials(supabase: ReturnType<typeof createClient>, tenantId: string): Promise<OmieCredentials> {
  const { data, error } = await supabase
    .from("omie_configurations")
    .select("app_key, app_secret")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Omie credentials not found");
  }

  const config = data as { app_key: string; app_secret: string };
  return { app_key: config.app_key, app_secret: config.app_secret };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenant_id, action, data: requestData } = await req.json();

    if (!tenant_id) {
      throw new Error("tenant_id is required");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);
    let result;

    switch (action) {
      // === CONTRATOS DE SERVIÇO ===
      case "listar_contratos": {
        result = await callOmieApi("servicos/contrato", "ListarContratos", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "consultar_contrato": {
        result = await callOmieApi("servicos/contrato", "ConsultarContrato", {
          nCodCtr: requestData.codigo_contrato,
        }, credentials);
        break;
      }

      case "incluir_contrato": {
        result = await callOmieApi("servicos/contrato", "IncluirContrato", requestData, credentials);
        break;
      }

      case "alterar_contrato": {
        result = await callOmieApi("servicos/contrato", "AlterarContrato", requestData, credentials);
        break;
      }

      case "cancelar_contrato": {
        result = await callOmieApi("servicos/contrato", "CancelarContrato", {
          nCodCtr: requestData.codigo_contrato,
          cMotivo: requestData.motivo || "Cancelamento solicitado via integração",
        }, credentials);
        break;
      }

      // === FATURAMENTO DE CONTRATOS ===
      case "faturar_contrato": {
        result = await callOmieApi("servicos/contrato", "FaturarContrato", {
          nCodCtr: requestData.codigo_contrato,
          dDtFat: requestData.data_faturamento,
        }, credentials);
        break;
      }

      case "listar_faturas_contrato": {
        result = await callOmieApi("servicos/contrato", "ListarFaturasContrato", {
          nCodCtr: requestData.codigo_contrato,
        }, credentials);
        break;
      }

      // === CONTRATOS A RENOVAR ===
      case "listar_renovacoes_pendentes": {
        const contratos = await callOmieApi("servicos/contrato", "ListarContratos", {
          nPagina: 1,
          nRegPorPagina: 500,
          cStatus: "A", // Ativos
        }, credentials);

        const hoje = new Date();
        const em30dias = new Date();
        em30dias.setDate(em30dias.getDate() + 30);

        // Filtrar contratos que vencem nos próximos 30 dias
        const renovacoes = (contratos.contratoCadastro || []).filter((c: { dDtFim?: string }) => {
          if (!c.dDtFim) return false;
          const dtFim = new Date(c.dDtFim.split("/").reverse().join("-"));
          return dtFim >= hoje && dtFim <= em30dias;
        });

        result = {
          contratos: renovacoes,
          total: renovacoes.length,
        };
        break;
      }

      // === CRM OMIE - CONTAS ===
      case "listar_contas_crm": {
        result = await callOmieApi("crm/contas", "ListarContas", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "incluir_conta_crm": {
        result = await callOmieApi("crm/contas", "IncluirConta", requestData, credentials);
        break;
      }

      // === CRM OMIE - OPORTUNIDADES ===
      case "listar_oportunidades": {
        result = await callOmieApi("crm/oportunidades", "ListarOportunidades", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "incluir_oportunidade": {
        result = await callOmieApi("crm/oportunidades", "IncluirOportunidade", requestData, credentials);
        break;
      }

      case "alterar_oportunidade": {
        result = await callOmieApi("crm/oportunidades", "AlterarOportunidade", requestData, credentials);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `contratos_crm_${action}`,
      entity_type: action.includes("crm") ? "crm" : "contrato",
      entity_id: requestData?.codigo_contrato?.toString(),
      status: "success",
      request_payload: requestData,
      response_payload: result,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-contratos-crm:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

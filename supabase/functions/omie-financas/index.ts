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
      // === CONTAS A RECEBER ===
      case "listar_contas_receber": {
        result = await callOmieApi("financas/contareceber", "ListarContasReceber", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
          apenas_importado_api: "N",
          ...requestData?.filtros,
        }, credentials);
        break;
      }

      case "consultar_conta_receber": {
        result = await callOmieApi("financas/contareceber", "ConsultarContaReceber", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "incluir_conta_receber": {
        result = await callOmieApi("financas/contareceber", "IncluirContaReceber", requestData, credentials);
        break;
      }

      case "alterar_conta_receber": {
        result = await callOmieApi("financas/contareceber", "AlterarContaReceber", requestData, credentials);
        break;
      }

      case "lancar_recebimento": {
        result = await callOmieApi("financas/contareceber", "LancarRecebimento", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
          codigo_baixa: requestData.codigo_baixa || Date.now().toString(),
          data: requestData.data,
          valor: requestData.valor,
          codigo_conta_corrente: requestData.codigo_conta_corrente,
          observacao: requestData.observacao || "",
        }, credentials);
        break;
      }

      // === CONTAS A PAGAR ===
      case "listar_contas_pagar": {
        result = await callOmieApi("financas/contapagar", "ListarContasPagar", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
          apenas_importado_api: "N",
          ...requestData?.filtros,
        }, credentials);
        break;
      }

      case "consultar_conta_pagar": {
        result = await callOmieApi("financas/contapagar", "ConsultarContaPagar", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "incluir_conta_pagar": {
        result = await callOmieApi("financas/contapagar", "IncluirContaPagar", requestData, credentials);
        break;
      }

      case "lancar_pagamento": {
        result = await callOmieApi("financas/contapagar", "LancarPagamento", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
          codigo_baixa: requestData.codigo_baixa || Date.now().toString(),
          data: requestData.data,
          valor: requestData.valor,
          codigo_conta_corrente: requestData.codigo_conta_corrente,
          observacao: requestData.observacao || "",
        }, credentials);
        break;
      }

      // === EXTRATO E MOVIMENTOS ===
      case "listar_movimentos": {
        result = await callOmieApi("financas/mf", "ListarMovimentos", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          dDtInicio: requestData.data_inicio,
          dDtFim: requestData.data_fim,
          nCodCC: requestData.codigo_conta_corrente,
        }, credentials);
        break;
      }

      case "listar_contas_correntes": {
        result = await callOmieApi("geral/contacorrente", "ListarContasCorrentes", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      // === RESUMO FINANCEIRO ===
      case "resumo_contas_receber": {
        result = await callOmieApi("financas/contareceber", "ResumoContasReceber", {
          dDtInicio: requestData.data_inicio,
          dDtFim: requestData.data_fim,
        }, credentials);
        break;
      }

      case "resumo_contas_pagar": {
        result = await callOmieApi("financas/contapagar", "ResumoContasPagar", {
          dDtInicio: requestData.data_inicio,
          dDtFim: requestData.data_fim,
        }, credentials);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `financas_${action}`,
      entity_type: "financas",
      status: "success",
      request_payload: requestData,
      response_payload: result,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-financas:", error);
    
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

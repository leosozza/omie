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

async function getOmieCredentials(supabase: any, tenantId: string): Promise<OmieCredentials> {
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
      // === GERAR BOLETO ===
      case "gerar_boleto": {
        // Primeiro, obter dados do título
        const titulo = await callOmieApi("financas/contareceber", "ConsultarContaReceber", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);

        // Gerar boleto para o título
        result = await callOmieApi("financas/boleto", "GerarBoleto", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
          enviar_email: requestData.enviar_email || "N",
          email_destino: requestData.email_destino || "",
        }, credentials);
        
        result.titulo = titulo;
        break;
      }

      case "segunda_via_boleto": {
        result = await callOmieApi("financas/boleto", "SegundaViaBoleto", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "cancelar_boleto": {
        result = await callOmieApi("financas/boleto", "CancelarBoleto", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "consultar_boleto": {
        result = await callOmieApi("financas/boleto", "ConsultarBoleto", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "prorrogar_boleto": {
        result = await callOmieApi("financas/boleto", "ProrrogarBoleto", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
          nova_data_vencimento: requestData.nova_data_vencimento,
        }, credentials);
        break;
      }

      // === GERAR PIX ===
      case "gerar_pix": {
        result = await callOmieApi("financas/pix", "GerarPix", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
          enviar_email: requestData.enviar_email || "N",
          email_destino: requestData.email_destino || "",
        }, credentials);
        break;
      }

      case "consultar_pix": {
        result = await callOmieApi("financas/pix", "ConsultarPix", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      case "cancelar_pix": {
        result = await callOmieApi("financas/pix", "CancelarPix", {
          codigo_lancamento_omie: requestData.codigo_lancamento_omie,
        }, credentials);
        break;
      }

      // === LISTAR BOLETOS/PIX PENDENTES ===
      case "listar_cobrancas_pendentes": {
        const contasReceber = await callOmieApi("financas/contareceber", "ListarContasReceber", {
          pagina: 1,
          registros_por_pagina: 100,
          filtrar_por_status: "ABERTO",
        }, credentials);

        result = {
          titulos: contasReceber.conta_receber_cadastro || [],
          total: contasReceber.total_de_registros || 0,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `boleto_pix_${action}`,
      entity_type: "boleto_pix",
      entity_id: requestData?.codigo_lancamento_omie?.toString(),
      status: "success",
      request_payload: requestData,
      response_payload: result,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-boleto-pix:", error);
    
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

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
      // === CONSULTA DE ESTOQUE ===
      case "consultar_posicao": {
        result = await callOmieApi("estoque/consulta", "ConsultarPosicaoEstoque", {
          codigo_local_estoque: requestData.codigo_local_estoque || 0,
          id_prod: requestData.id_prod,
          codigo_produto: requestData.codigo_produto,
        }, credentials);
        break;
      }

      case "listar_posicao": {
        result = await callOmieApi("estoque/consulta", "ListarPosEstoque", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          codigo_local_estoque: requestData.codigo_local_estoque || 0,
        }, credentials);
        break;
      }

      case "listar_produtos_abaixo_minimo": {
        const posicao = await callOmieApi("estoque/consulta", "ListarPosEstoque", {
          nPagina: 1,
          nRegPorPagina: 500,
        }, credentials);

        // Filtrar produtos abaixo do estoque mínimo
        const produtosAbaixo = (posicao.produtos || []).filter((p: { nSaldo: number; nEstoqueMinimo: number }) => 
          p.nSaldo < p.nEstoqueMinimo
        );

        result = {
          produtos: produtosAbaixo,
          total: produtosAbaixo.length,
        };
        break;
      }

      // === MOVIMENTAÇÕES ===
      case "incluir_movimento": {
        result = await callOmieApi("estoque/ajuste", "IncluirAjusteEstoque", {
          codigo_local_estoque: requestData.codigo_local_estoque || 0,
          id_prod: requestData.id_prod,
          codigo_produto: requestData.codigo_produto,
          tipo: requestData.tipo, // "E" = entrada, "S" = saída
          quantidade: requestData.quantidade,
          valor: requestData.valor || 0,
          obs: requestData.observacao || "",
          data: requestData.data,
        }, credentials);
        break;
      }

      case "listar_movimentos": {
        result = await callOmieApi("estoque/movestoque", "ListarMovimentos", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          dDtInicial: requestData.data_inicio,
          dDtFinal: requestData.data_fim,
        }, credentials);
        break;
      }

      // === LOCAIS DE ESTOQUE ===
      case "listar_locais": {
        result = await callOmieApi("estoque/local", "ListarLocaisEstoque", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      // === RESERVAS ===
      case "listar_reservas": {
        result = await callOmieApi("estoque/reserva", "ListarReservas", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
          id_prod: requestData.id_prod,
        }, credentials);
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `estoque_${action}`,
      entity_type: "estoque",
      entity_id: requestData?.id_prod?.toString() || requestData?.codigo_produto,
      status: "success",
      request_payload: requestData,
      response_payload: result,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-estoque:", error);
    
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

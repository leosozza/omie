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
      // === REQUISIÇÕES DE COMPRA ===
      case "listar_requisicoes": {
        result = await callOmieApi("produtos/requisicaocompra", "ListarRequisicoes", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "incluir_requisicao": {
        result = await callOmieApi("produtos/requisicaocompra", "IncluirRequisicao", requestData, credentials);
        break;
      }

      case "aprovar_requisicao": {
        result = await callOmieApi("produtos/requisicaocompra", "AprovarRequisicao", {
          nCodReq: requestData.codigo_requisicao,
        }, credentials);
        break;
      }

      // === PEDIDOS DE COMPRA ===
      case "listar_pedidos_compra": {
        result = await callOmieApi("produtos/pedidocompra", "ListarPedidosCompra", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "consultar_pedido_compra": {
        result = await callOmieApi("produtos/pedidocompra", "ConsultarPedidoCompra", {
          nCodPedido: requestData.codigo_pedido,
        }, credentials);
        break;
      }

      case "incluir_pedido_compra": {
        result = await callOmieApi("produtos/pedidocompra", "IncluirPedidoCompra", requestData, credentials);
        break;
      }

      case "alterar_pedido_compra": {
        result = await callOmieApi("produtos/pedidocompra", "AlterarPedidoCompra", requestData, credentials);
        break;
      }

      // === NOTAS DE ENTRADA ===
      case "listar_notas_entrada": {
        result = await callOmieApi("produtos/nfentrada", "ListarNFEntrada", {
          nPagina: requestData?.pagina || 1,
          nRegPorPagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      case "incluir_nota_entrada": {
        result = await callOmieApi("produtos/nfentrada", "IncluirNFEntrada", requestData, credentials);
        break;
      }

      // === FORNECEDORES ===
      case "listar_fornecedores": {
        result = await callOmieApi("geral/clientes", "ListarClientes", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
          clientesFiltro: {
            tags: ["fornecedor"],
          },
        }, credentials);
        break;
      }

      // === CENTROS DE CUSTO (DEPARTAMENTOS) ===
      case "listar_centros_custo": {
        result = await callOmieApi("geral/departamentos", "ListarDepartamentos", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      // === CATEGORIAS ===
      case "listar_categorias": {
        result = await callOmieApi("geral/categorias", "ListarCategorias", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 200,
        }, credentials);
        break;
      }

      // === CONTAS CORRENTES ===
      case "listar_contas_correntes": {
        result = await callOmieApi("geral/contacorrente", "ListarContasCorrentes", {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        }, credentials);
        break;
      }

      // === CONTAS A PAGAR (AVANÇADO COM RATEIO) ===
      case "incluir_conta_pagar_avancado": {
        const payload: Record<string, unknown> = {
          codigo_lancamento_integracao: requestData.codigo_lancamento_integracao,
          codigo_cliente_fornecedor: requestData.codigo_cliente_fornecedor,
          data_vencimento: requestData.data_vencimento,
          valor_documento: requestData.valor_documento,
          codigo_categoria: requestData.codigo_categoria || "",
          id_conta_corrente: requestData.id_conta_corrente || 0,
          observacao: requestData.observacao || "",
        };

        // Rateio por centro de custo (distribuição)
        if (requestData.distribuicao && Array.isArray(requestData.distribuicao)) {
          payload.distribuicao = requestData.distribuicao.map((d: any) => ({
            cCodDepartamento: d.codigo_departamento || d.cCodDepartamento,
            nValorFixo: d.valor_fixo || d.nValorFixo || 0,
            nPercentual: d.percentual || d.nPercentual || 0,
          }));
        }

        result = await callOmieApi("financas/contapagar", "IncluirContaPagar", payload, credentials);
        break;
      }

      // === IMPORTAR NF-e VIA CHAVE DANFE ===
      case "importar_nfe_danfe": {
        if (!requestData.chave_acesso) {
          throw new Error("chave_acesso (44 dígitos) é obrigatória");
        }
        result = await callOmieApi("produtos/nfentrada", "ImportarNFeEntrada", {
          cChaveNFe: requestData.chave_acesso,
        }, credentials);
        break;
      }

      // === PURCHASE CONFIG (CRUD via service_role) ===
      case "salvar_purchase_config": {
        // Upsert: if same config_type + omie_code + is_default exists, update
        const { data: existing } = await supabase
          .from("purchase_config")
          .select("id")
          .eq("tenant_id", tenant_id)
          .eq("config_type", requestData.config_type)
          .eq("omie_code", requestData.omie_code)
          .maybeSingle();

        if (existing) {
          const { data: updated, error: upErr } = await supabase
            .from("purchase_config")
            .update({
              omie_name: requestData.omie_name,
              percentual: requestData.percentual || null,
              is_default: requestData.is_default || false,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (upErr) throw upErr;
          result = updated;
        } else {
          // If is_default, clear other defaults of same type
          if (requestData.is_default) {
            await supabase
              .from("purchase_config")
              .update({ is_default: false })
              .eq("tenant_id", tenant_id)
              .eq("config_type", requestData.config_type);
          }
          const { data: inserted, error: insErr } = await supabase
            .from("purchase_config")
            .insert({
              tenant_id,
              config_type: requestData.config_type,
              omie_code: requestData.omie_code,
              omie_name: requestData.omie_name,
              percentual: requestData.percentual || null,
              is_default: requestData.is_default || false,
              is_active: true,
            })
            .select()
            .single();
          if (insErr) throw insErr;
          result = inserted;
        }
        break;
      }

      case "listar_purchase_config": {
        const { data: cfgs, error: cfgErr } = await supabase
          .from("purchase_config")
          .select("*")
          .eq("tenant_id", tenant_id)
          .eq("is_active", true)
          .order("config_type");
        if (cfgErr) throw cfgErr;
        result = cfgs;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `compras_${action}`,
      entity_type: "compras",
      entity_id: requestData?.codigo_pedido?.toString() || requestData?.codigo_requisicao?.toString(),
      status: "success",
      request_payload: requestData,
      response_payload: result,
    });

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in omie-compras:", error);
    
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OMIE_API_URL = "https://app.omie.com.br/api/v1";

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(
  endpoint: string,
  call: string,
  params: any,
  credentials: OmieCredentials
) {
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

  const data = await response.json();

  if (data.faultstring) {
    throw new Error(data.faultstring);
  }

  return data;
}

async function getOmieCredentials(supabase: any, tenantId: string): Promise<OmieCredentials> {
  const { data, error } = await supabase
    .from("omie_configurations")
    .select("app_key, app_secret")
    .eq("tenant_id", tenantId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Omie credentials not found or inactive");
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      tenant_id, 
      action = "create",
      order_data,
      bitrix_deal_id,
    } = await req.json();

    if (!tenant_id) {
      throw new Error("Missing tenant_id");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);

    let result;

    switch (action) {
      case "create":
        // Prepare order items (produtos)
        const itens = (order_data.products || []).map((product: any, index: number) => ({
          ide: index + 1,
          codigo_produto: product.code || "",
          codigo_produto_integracao: product.integration_code || `PROD_${index}`,
          descricao: product.name || product.description,
          quantidade: product.quantity || 1,
          valor_unitario: product.unit_price || 0,
          percentual_desconto: product.discount_percent || 0,
          tipo_desconto: "P",
        }));

        const createPayload = {
          cabecalho: {
            codigo_pedido_integracao: bitrix_deal_id || `BITRIX_DEAL_${Date.now()}`,
            codigo_cliente: order_data.customer_omie_id,
            data_previsao: order_data.expected_date || new Date().toISOString().split("T")[0],
            etapa: order_data.stage || "10", // 10 = Em aberto
            codigo_parcela: order_data.payment_code || "000",
            quantidade_itens: itens.length,
          },
          det: itens,
          informacoes_adicionais: {
            codigo_categoria: order_data.category_code || "",
            codigo_conta_corrente: order_data.account_code || "",
            consumidor_final: order_data.final_consumer || "S",
            enviar_email: order_data.send_email || "N",
          },
          observacoes: {
            obs_venda: order_data.notes || `Pedido criado via Bitrix24 - Deal #${bitrix_deal_id}`,
          },
        };

        result = await callOmieApi(
          "produtos/pedido",
          "IncluirPedido",
          createPayload,
          credentials
        );
        break;

      case "status":
        // Get order status
        if (!order_data.codigo_pedido) {
          throw new Error("Missing codigo_pedido");
        }

        result = await callOmieApi(
          "produtos/pedido",
          "StatusPedido",
          { codigo_pedido: order_data.codigo_pedido },
          credentials
        );
        break;

      case "get":
        // Get order details
        if (!order_data.codigo_pedido) {
          throw new Error("Missing codigo_pedido");
        }

        result = await callOmieApi(
          "produtos/pedido",
          "ConsultarPedido",
          { codigo_pedido: order_data.codigo_pedido },
          credentials
        );
        break;

      case "list":
        // List orders with filters
        result = await callOmieApi(
          "produtos/pedido",
          "ListarPedidos",
          {
            pagina: order_data.page || 1,
            registros_por_pagina: order_data.per_page || 50,
            apenas_importado_api: "N",
            filtrar_por_data_de: order_data.date_from || "",
            filtrar_por_data_ate: order_data.date_to || "",
            filtrar_por_etapa: order_data.stage_filter || "",
          },
          credentials
        );
        break;

      case "cancel":
        // Cancel order
        if (!order_data.codigo_pedido) {
          throw new Error("Missing codigo_pedido");
        }

        // In Omie, you update the stage to cancelled
        result = await callOmieApi(
          "produtos/pedido",
          "TrocarEtapaPedido",
          {
            codigo_pedido: order_data.codigo_pedido,
            etapa: "90", // 90 = Cancelado
          },
          credentials
        );
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const executionTime = Date.now() - startTime;

    // Log successful operation
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `order_${action}`,
      entity_type: "order",
      entity_id: bitrix_deal_id || order_data.codigo_pedido,
      status: "success",
      request_payload: order_data,
      response_payload: result,
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        execution_time_ms: executionTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error("Order operation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.clone().json().catch(() => ({}));

    await supabase.from("integration_logs").insert({
      tenant_id: body.tenant_id,
      action: `order_${body.action || "unknown"}`,
      entity_type: "order",
      status: "error",
      error_message: errorMessage,
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

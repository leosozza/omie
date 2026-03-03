import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OmieCredentials {
  app_key: string;
  app_secret: string;
}

async function callOmieApi(
  endpoint: string,
  call: string,
  params: Record<string, unknown>,
  credentials: OmieCredentials
) {
  const response = await fetch(`https://app.omie.com.br/api/v1/${endpoint}`, {
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
    throw new Error("Omie credentials not found for this tenant");
  }
  return { app_key: data.app_key, app_secret: data.app_secret };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { tenant_id, action, data: requestData } = await req.json();

    if (!tenant_id || !action) {
      return new Response(
        JSON.stringify({ success: false, error: "tenant_id and action are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);
    let result: any;

    switch (action) {
      // === PRODUCTS ===
      case "listar_produtos": {
        const params = {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
          apenas_importado_api: "N",
          filtrar_apenas_omiepdv: "N",
          ...(requestData?.filtros || {}),
        };
        result = await callOmieApi("geral/produtos/", "ListarProdutos", params, credentials);
        break;
      }

      case "consultar_produto": {
        if (!requestData?.nCodProd && !requestData?.cCodIntProd && !requestData?.codigo) {
          throw new Error("nCodProd, cCodIntProd or codigo is required");
        }
        const params: Record<string, unknown> = {};
        if (requestData.nCodProd) params.nCodProd = requestData.nCodProd;
        if (requestData.cCodIntProd) params.cCodIntProd = requestData.cCodIntProd;
        if (requestData.codigo) params.codigo = requestData.codigo;
        result = await callOmieApi("geral/produtos/", "ConsultarProduto", params, credentials);
        break;
      }

      case "incluir_produto": {
        if (!requestData?.descricao || !requestData?.codigo) {
          throw new Error("descricao and codigo are required");
        }
        result = await callOmieApi("geral/produtos/", "IncluirProduto", requestData, credentials);
        break;
      }

      case "alterar_produto": {
        if (!requestData?.nCodProd) {
          throw new Error("nCodProd is required");
        }
        result = await callOmieApi("geral/produtos/", "AlterarProduto", requestData, credentials);
        break;
      }

      // === PRICE TABLES ===
      case "listar_tabelas_precos": {
        const params = {
          nPagina: requestData?.nPagina || 1,
          nRegPorPagina: requestData?.nRegPorPagina || 50,
        };
        result = await callOmieApi("produtos/tabelaprecos/", "ListarTabelasPrecos", params, credentials);
        break;
      }

      case "consultar_tabela_precos": {
        if (!requestData?.nCodTabPreco) {
          throw new Error("nCodTabPreco is required");
        }
        result = await callOmieApi("produtos/tabelaprecos/", "ConsultarTabelaPrecos", { nCodTabPreco: requestData.nCodTabPreco }, credentials);
        break;
      }

      case "listar_itens_tabela_precos": {
        if (!requestData?.nCodTabPreco) {
          throw new Error("nCodTabPreco is required");
        }
        const params = {
          nCodTabPreco: requestData.nCodTabPreco,
          nPagina: requestData?.nPagina || 1,
          nRegPorPagina: requestData?.nRegPorPagina || 50,
        };
        result = await callOmieApi("produtos/tabelaprecos/", "ListarItensTabelaPrecos", params, credentials);
        break;
      }

      // === PRODUCT FAMILIES / CATEGORIES ===
      case "listar_familias": {
        const params = {
          pagina: requestData?.pagina || 1,
          registros_por_pagina: requestData?.registros_por_pagina || 50,
        };
        result = await callOmieApi("geral/familias/", "PesquisarFamilias", params, credentials);
        break;
      }

      // === PRODUCT CHARACTERISTICS ===
      case "listar_caracteristicas": {
        const params = {
          nPagina: requestData?.nPagina || 1,
          nRegPorPagina: requestData?.nRegPorPagina || 50,
        };
        result = await callOmieApi("geral/malha/", "ListarCarwordsacteristicas", params, credentials);
        break;
      }

      // === SYNC TO BITRIX ===
      case "sync_to_bitrix": {
        // Get Bitrix credentials for this tenant
        const { data: installation } = await supabase
          .from("bitrix_installations")
          .select("access_token, client_endpoint")
          .eq("member_id", tenant_id)
          .eq("status", "active")
          .single();

        if (!installation) {
          throw new Error("Bitrix installation not found");
        }

        const produto = requestData?.produto || requestData;
        if (!produto) {
          throw new Error("Product data is required for sync");
        }

        // Build Bitrix product payload
        const bitrixProduct: Record<string, unknown> = {
          NAME: produto.descricao || produto.cDescricao || "Sem nome",
          CURRENCY_ID: "BRL",
          PRICE: produto.valor_unitario || produto.nPrecoUnitario || 0,
          DESCRIPTION: produto.obs_internas || produto.descr_detalhada || "",
          XML_ID: `omie_${produto.codigo_produto || produto.nCodProd || ""}`,
        };

        // Map SKU/NCM to custom fields
        if (produto.codigo || produto.cCodigo) {
          bitrixProduct.PROPERTY_SKU = produto.codigo || produto.cCodigo;
        }
        if (produto.ncm || produto.cNCM) {
          bitrixProduct.PROPERTY_NCM = produto.ncm || produto.cNCM;
        }
        if (produto.unidade || produto.cUnidade) {
          bitrixProduct.MEASURE = produto.unidade || produto.cUnidade;
        }

        // Check if product already exists in Bitrix by XML_ID
        const searchUrl = `${installation.client_endpoint}crm.product.list?filter[XML_ID]=${bitrixProduct.XML_ID}&auth=${installation.access_token}`;
        const searchResp = await fetch(searchUrl);
        const searchData = await searchResp.json();

        let bitrixResult;
        if (searchData.result && searchData.result.length > 0) {
          // Update existing
          const existingId = searchData.result[0].ID;
          const updateUrl = `${installation.client_endpoint}crm.product.update`;
          const updateResp = await fetch(updateUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: existingId,
              fields: bitrixProduct,
              auth: installation.access_token,
            }),
          });
          bitrixResult = await updateResp.json();
          bitrixResult._action = "updated";
          bitrixResult._bitrix_id = existingId;
        } else {
          // Create new
          const createUrl = `${installation.client_endpoint}crm.product.add`;
          const createResp = await fetch(createUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fields: bitrixProduct,
              auth: installation.access_token,
            }),
          });
          bitrixResult = await createResp.json();
          bitrixResult._action = "created";
        }

        result = { omie_product: produto, bitrix_result: bitrixResult };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Log success
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `produtos_${action}`,
      entity_type: "product",
      entity_id: requestData?.nCodProd?.toString() || requestData?.codigo || null,
      status: "success",
      request_payload: { action, data: requestData },
      response_payload: result,
      execution_time_ms: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("omie-produtos error:", errorMessage);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

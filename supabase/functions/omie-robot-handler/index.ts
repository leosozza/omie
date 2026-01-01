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

async function callBitrixApi(
  clientEndpoint: string,
  method: string,
  params: any,
  accessToken: string
) {
  const response = await fetch(`${clientEndpoint}${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auth: accessToken,
      ...params,
    }),
  });

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
    throw new Error("Omie credentials not found or inactive");
  }

  return data;
}

async function getInstallation(supabase: any, tenantId: string) {
  const { data, error } = await supabase
    .from("bitrix_installations")
    .select("*")
    .eq("member_id", tenantId)
    .single();

  if (error || !data) {
    throw new Error("Bitrix installation not found");
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

    // Parse Bitrix robot request
    const contentType = req.headers.get("content-type") || "";
    let robotData: any;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      robotData = {
        code: formData.get("code"),
        document_id: formData.get("document_id"),
        document_type: formData.get("document_type"),
        event_token: formData.get("event_token"),
        properties: {},
        auth: {},
      };

      // Parse properties
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("properties[")) {
          const propName = key.match(/properties\[([^\]]+)\]/)?.[1];
          if (propName) {
            robotData.properties[propName] = value;
          }
        }
        if (key.startsWith("auth[")) {
          const authKey = key.match(/auth\[([^\]]+)\]/)?.[1];
          if (authKey) {
            robotData.auth[authKey] = value;
          }
        }
      }
    } else {
      robotData = await req.json();
    }

    console.log("Robot handler called:", robotData.code);

    const memberId = robotData.auth?.member_id;
    if (!memberId) {
      throw new Error("Missing member_id in robot request");
    }

    const installation = await getInstallation(supabase, memberId);
    const omieCredentials = await getOmieCredentials(supabase, memberId);

    // Extract deal ID from document_id
    // Format: "DEAL_123" or ["crm", "CCrmDocumentDeal", "DEAL_123"]
    let dealId: string;
    if (Array.isArray(robotData.document_id)) {
      dealId = robotData.document_id[2]?.replace("DEAL_", "") || "";
    } else {
      dealId = robotData.document_id?.replace("DEAL_", "") || "";
    }

    // Get deal data from Bitrix
    const dealResponse = await callBitrixApi(
      installation.client_endpoint,
      "crm.deal.get",
      { id: dealId },
      installation.access_token
    );

    const deal = dealResponse.result;
    if (!deal) {
      throw new Error(`Deal not found: ${dealId}`);
    }

    let result: any = {};
    let returnFields: any = {};

    switch (robotData.code) {
      case "OMIE_CREATE_ORDER":
        // Get deal products
        const productsResponse = await callBitrixApi(
          installation.client_endpoint,
          "crm.deal.productrows.get",
          { id: dealId },
          installation.access_token
        );

        const products = (productsResponse.result || []).map((p: any) => ({
          code: p.PRODUCT_ID,
          name: p.PRODUCT_NAME,
          quantity: p.QUANTITY,
          unit_price: p.PRICE,
          discount_percent: p.DISCOUNT_RATE || 0,
        }));

        // Create order in Omie
        result = await callOmieApi(
          "produtos/pedido",
          "IncluirPedido",
          {
            cabecalho: {
              codigo_pedido_integracao: `BITRIX_DEAL_${dealId}`,
              codigo_cliente: robotData.properties?.customer_omie_id || 0,
              data_previsao: new Date().toISOString().split("T")[0],
              etapa: "10",
            },
            det: products.map((p: any, i: number) => ({
              ide: i + 1,
              codigo_produto_integracao: `PROD_${p.code}`,
              descricao: p.name,
              quantidade: p.quantity,
              valor_unitario: p.unit_price,
              percentual_desconto: p.discount_percent,
            })),
            observacoes: {
              obs_venda: `Pedido gerado via Bitrix24 - Negócio #${dealId}`,
            },
          },
          omieCredentials
        );

        returnFields = {
          omie_order_id: result.codigo_pedido,
          omie_order_code: result.codigo_pedido_integracao,
        };
        break;

      case "OMIE_CREATE_SERVICE_ORDER":
        // Create service order in Omie
        result = await callOmieApi(
          "servicos/os",
          "IncluirOS",
          {
            Cabecalho: {
              cCodIntOS: `BITRIX_OS_${dealId}`,
              nCodCli: robotData.properties?.customer_omie_id || 0,
              dDtPrevisao: new Date().toISOString().split("T")[0],
              cEtapa: "10",
            },
            ServicosPrestados: [
              {
                nSeqItem: 1,
                cDescricao: deal.TITLE || "Serviço",
                nQtde: 1,
                nValUnit: parseFloat(deal.OPPORTUNITY) || 0,
              },
            ],
            Observacoes: {
              cObsOS: `OS gerada via Bitrix24 - Negócio #${dealId}`,
            },
          },
          omieCredentials
        );

        returnFields = {
          omie_os_id: result.nCodOS,
          omie_os_code: result.cCodIntOS,
        };
        break;

      case "OMIE_CHECK_PAYMENT":
        // Check financial status
        const orderCode = robotData.properties?.omie_order_id;
        if (!orderCode) {
          throw new Error("Missing omie_order_id property");
        }

        result = await callOmieApi(
          "financas/contareceber",
          "ListarContasReceber",
          {
            pagina: 1,
            registros_por_pagina: 10,
            filtrar_por_numero_pedido: orderCode,
          },
          omieCredentials
        );

        const receivables = result.conta_receber_cadastro || [];
        const totalReceivables = receivables.length;
        const paidCount = receivables.filter((r: any) => r.status_titulo === "LIQUIDADO").length;

        let paymentStatus = "ABERTO";
        if (paidCount === totalReceivables && totalReceivables > 0) {
          paymentStatus = "LIQUIDADO";
        } else if (paidCount > 0) {
          paymentStatus = "PARCIAL";
        } else if (receivables.some((r: any) => new Date(r.data_vencimento) < new Date())) {
          paymentStatus = "ATRASADO";
        }

        returnFields = {
          payment_status: paymentStatus,
          total_receivables: totalReceivables,
          paid_count: paidCount,
        };
        break;

      case "OMIE_GET_INVOICE":
        // Get invoice PDF
        const invoiceOrderCode = robotData.properties?.omie_order_id;
        if (!invoiceOrderCode) {
          throw new Error("Missing omie_order_id property");
        }

        // Find NFe by order
        const nfeList = await callOmieApi(
          "produtos/nfe",
          "ListarNFe",
          {
            nPagina: 1,
            nRegPorPagina: 10,
            nCodPedido: invoiceOrderCode,
          },
          omieCredentials
        );

        const nfe = nfeList.nfe_cadastro?.[0];
        if (nfe) {
          const pdfResult = await callOmieApi(
            "produtos/nfe",
            "ObterLinkNFe",
            { nCodNFe: nfe.nCodNFe },
            omieCredentials
          );

          returnFields = {
            invoice_number: nfe.nNF,
            invoice_status: nfe.cStatus,
            invoice_pdf_url: pdfResult.cLinkDanfe || pdfResult.cLinkNFe,
          };
        } else {
          returnFields = {
            invoice_number: "",
            invoice_status: "NAO_ENCONTRADA",
            invoice_pdf_url: "",
          };
        }
        break;

      case "OMIE_SYNC_STOCK":
        // Sync stock for deal products
        const stockProducts = await callBitrixApi(
          installation.client_endpoint,
          "crm.deal.productrows.get",
          { id: dealId },
          installation.access_token
        );

        const stockInfo: any[] = [];
        for (const product of stockProducts.result || []) {
          try {
            const stockResult = await callOmieApi(
              "estoque/consulta",
              "ListarPosEstoque",
              {
                nPagina: 1,
                nRegPorPagina: 1,
                cCodInt: `PROD_${product.PRODUCT_ID}`,
              },
              omieCredentials
            );

            const stock = stockResult.produtos?.[0];
            if (stock) {
              stockInfo.push({
                product_id: product.PRODUCT_ID,
                product_name: product.PRODUCT_NAME,
                stock_quantity: stock.nSaldo || 0,
              });
            }
          } catch (e) {
            console.error("Error fetching stock for product:", product.PRODUCT_ID, e);
          }
        }

        returnFields = {
          stock_sync_count: stockInfo.length,
          stock_info: JSON.stringify(stockInfo),
        };
        break;

      default:
        throw new Error(`Unknown robot code: ${robotData.code}`);
    }

    const executionTime = Date.now() - startTime;

    // Log successful robot execution
    await supabase.from("integration_logs").insert({
      tenant_id: memberId,
      action: `robot_${robotData.code}`,
      entity_type: "robot",
      entity_id: dealId,
      status: "success",
      request_payload: robotData.properties,
      response_payload: { result, returnFields },
      execution_time_ms: executionTime,
    });

    // Return result to Bitrix (format required by bizproc)
    return new Response(
      JSON.stringify({
        return_values: returnFields,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error("Robot handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Log error
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabase.from("integration_logs").insert({
      tenant_id: "unknown",
      action: "robot_error",
      entity_type: "robot",
      status: "error",
      error_message: errorMessage,
      execution_time_ms: executionTime,
    });

    // Return error in Bitrix format
    return new Response(
      JSON.stringify({
        error: errorMessage,
        return_values: {
          error_message: errorMessage,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Bitrix expects 200 even for errors
      }
    );
  }
});

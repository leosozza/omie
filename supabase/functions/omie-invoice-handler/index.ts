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
      action,
      invoice_type = "nfe", // nfe or nfse
      invoice_data,
    } = await req.json();

    if (!tenant_id) {
      throw new Error("Missing tenant_id");
    }

    const credentials = await getOmieCredentials(supabase, tenant_id);

    let result;
    const isNFSe = invoice_type === "nfse";

    switch (action) {
      case "get":
        // Get invoice details
        if (isNFSe) {
          if (!invoice_data.codigo_nfse) {
            throw new Error("Missing codigo_nfse");
          }
          result = await callOmieApi(
            "servicos/nfse",
            "ConsultarNFSe",
            { nCodNFSe: invoice_data.codigo_nfse },
            credentials
          );
        } else {
          if (!invoice_data.codigo_nfe) {
            throw new Error("Missing codigo_nfe");
          }
          result = await callOmieApi(
            "produtos/nfe",
            "ConsultarNFe",
            { nCodNFe: invoice_data.codigo_nfe },
            credentials
          );
        }
        break;

      case "get_pdf":
        // Get invoice PDF URL
        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "ObterLinkNFSe",
            { nCodNFSe: invoice_data.codigo_nfse },
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "ObterLinkNFe",
            { nCodNFe: invoice_data.codigo_nfe },
            credentials
          );
        }
        break;

      case "get_xml":
        // Get invoice XML
        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "ObterXmlNFSe",
            { nCodNFSe: invoice_data.codigo_nfse },
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "ObterXmlNFe",
            { nCodNFe: invoice_data.codigo_nfe },
            credentials
          );
        }
        break;

      case "list":
        // List invoices
        const listParams = {
          nPagina: invoice_data.page || 1,
          nRegPorPagina: invoice_data.per_page || 50,
          dDtEmissaoDe: invoice_data.date_from || "",
          dDtEmissaoAte: invoice_data.date_to || "",
        };

        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "ListarNFSe",
            listParams,
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "ListarNFe",
            listParams,
            credentials
          );
        }
        break;

      case "status":
        // Check invoice status
        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "StatusNFSe",
            { nCodNFSe: invoice_data.codigo_nfse },
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "StatusNFe",
            { nCodNFe: invoice_data.codigo_nfe },
            credentials
          );
        }
        break;

      case "cancel":
        // Cancel invoice
        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "CancelarNFSe",
            { 
              nCodNFSe: invoice_data.codigo_nfse,
              cMotivo: invoice_data.cancel_reason || "Cancelado via integração",
            },
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "CancelarNFe",
            { 
              nCodNFe: invoice_data.codigo_nfe,
              cJustificativa: invoice_data.cancel_reason || "Cancelado via integração",
            },
            credentials
          );
        }
        break;

      case "search_by_order":
        // Find invoice by order/OS
        if (isNFSe) {
          result = await callOmieApi(
            "servicos/nfse",
            "ListarNFSe",
            {
              nPagina: 1,
              nRegPorPagina: 10,
              nCodOS: invoice_data.codigo_os,
            },
            credentials
          );
        } else {
          result = await callOmieApi(
            "produtos/nfe",
            "ListarNFe",
            {
              nPagina: 1,
              nRegPorPagina: 10,
              nCodPedido: invoice_data.codigo_pedido,
            },
            credentials
          );
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const executionTime = Date.now() - startTime;

    // Log successful operation
    await supabase.from("integration_logs").insert({
      tenant_id,
      action: `invoice_${action}`,
      entity_type: invoice_type,
      entity_id: invoice_data.codigo_nfe || invoice_data.codigo_nfse,
      status: "success",
      request_payload: invoice_data,
      response_payload: result,
      execution_time_ms: executionTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        invoice_type,
        execution_time_ms: executionTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const executionTime = Date.now() - startTime;
    console.error("Invoice operation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.clone().json().catch(() => ({}));

    await supabase.from("integration_logs").insert({
      tenant_id: body.tenant_id,
      action: `invoice_${body.action || "unknown"}`,
      entity_type: body.invoice_type || "invoice",
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
